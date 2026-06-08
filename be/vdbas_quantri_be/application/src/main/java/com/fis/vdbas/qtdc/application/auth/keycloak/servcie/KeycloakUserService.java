package com.fis.vdbas.qtdc.application.auth.keycloak.servcie;

import com.fis.vdbas.common.exception.BusinessException;
import com.fis.vdbas.qtdc.common.Constants;
import com.fis.vdbas.common.exception.DuplicateResourceException;
import com.fis.vdbas.common.exception.InvalidOperationException;
import com.fis.vdbas.qtdc.common.enums.OwnerType;
import com.fis.vdbas.qtdc.domain.user.User;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import com.fis.vdbas.qtdc.application.auth.keycloak.KeycloakProperties;

import java.util.List;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakUserService {

    private final Keycloak keycloak;
    private final KeycloakProperties properties;

    private RealmResource realm() {
        return keycloak.realm(properties.getRealm());
    }

    private UsersResource users() {
        return realm().users();
    }

    /**
     * Create user on Keycloak, return the Keycloak ID (UUID as string).
     */
    public String createUser(User user, String rawPassword) {
        UserRepresentation rep = new UserRepresentation();
        rep.setUsername(user.getUsername());
        rep.setEnabled(true);
        if (user.getOwnerType() == OwnerType.PERSON) {
            rep.setEmail(user.getOwnerPerson().getEmail());
        } else if (user.getOwnerType() == OwnerType.ORG) {
            rep.setEmail(user.getOwnerOrganization().getEmail());
        }
        // if (StringUtils.hasText(user.getEmail())) {
        // rep.setEmail(user.getEmail());
        // }
        if (StringUtils.hasText(user.getDisplayName())) {
            rep.setFirstName(user.getDisplayName());
        }

        String passwordToSet = StringUtils.hasText(rawPassword) ? rawPassword : properties.getDefaultPassword();
        CredentialRepresentation cred = new CredentialRepresentation();
        cred.setType(CredentialRepresentation.PASSWORD);
        cred.setTemporary(false);
        cred.setValue(passwordToSet);
        rep.setCredentials(List.of(cred));

        Response response = users().create(rep);
        if (response.getStatus() >= 300) {
            log.error("Keycloak create user failed: status={}, reason={}", response.getStatus(),
                    response.getStatusInfo());
            String reason = response.getStatusInfo() != null ? response.getStatusInfo().getReasonPhrase()
                    : "Unknown error";
            int status = response.getStatus();
            response.close();
            handleKeycloakError(status, reason, user.getUsername());
        }
        String location = response.getLocation().getPath();
        String keycloakId = location.substring(location.lastIndexOf('/') + 1);
        response.close();
        return keycloakId;
    }

    public void updateUser(User user) {
        String kcId = user.getExternalId();
        if (!StringUtils.hasText(kcId)) {
            throw new IllegalStateException(Constants.ErrorMessage.KEYCLOAK_USER_MISSING_EXTERNAL_ID);
        }
        try {
            UserRepresentation rep = users().get(kcId).toRepresentation();
            rep.setUsername(user.getUsername());
            rep.setEnabled(Integer.valueOf(1).equals(user.getStatus()) && !FLAG_TRUE.equals(user.getDeleted()));
            if (user.getOwnerType() == OwnerType.PERSON) {
                rep.setEmail(user.getOwnerPerson().getEmail());
            } else if (user.getOwnerType() == OwnerType.ORG) {
                rep.setEmail(user.getOwnerOrganization().getEmail());
            }
            // if (StringUtils.hasText(user.getEmail())) {
            // rep.setEmail(user.getEmail());
            // }
            rep.setFirstName(user.getDisplayName());
            users().get(kcId).update(rep);
        } catch (WebApplicationException ex) {
            int status = ex.getResponse() != null ? ex.getResponse().getStatus() : 500;
            log.error("Keycloak update user failed: status={}, message={}", status, ex.getMessage());
            handleKeycloakError(status, ex.getMessage(), user.getUsername());
        }
    }

    public void deleteUser(String keycloakId) {
        if (!StringUtils.hasText(keycloakId)) {
            return;
        }
        try {
            users().delete(keycloakId);
        } catch (WebApplicationException ex) {
            int status = ex.getResponse() != null ? ex.getResponse().getStatus() : 500;
            if (status != 404) {
                log.error("Keycloak delete user failed: status={}, message={}", status, ex.getMessage());
                handleKeycloakError(status, ex.getMessage(), null);
            }
        }
    }

    /**
     * Find user in Keycloak by username, return ID or null if not present.
     */
    public String findKeycloakIdByUsername(String username) {
        List<UserRepresentation> list;
        try {
            list = users().search(username, true);
        } catch (WebApplicationException ex) {
            int status = ex.getResponse() != null ? ex.getResponse().getStatus() : 500;
            log.error("Keycloak search user failed: status={}, message={}", status, ex.getMessage());
            handleKeycloakError(status, ex.getMessage(), username);
            return null; // Won't happen as handleKeycloakError throws
        }
        if (list.isEmpty()) {
            return null;
        }
        return list.get(0).getId();
    }

    /**
     * Sync: ensure externalId has a value, if not, create a new user on
     * Keycloak.
     */
    public String ensureUserExists(User user, String rawPassword) {
        if (StringUtils.hasText(user.getExternalId())) {
            return user.getExternalId();
        }
        // try to find by username
        String existed = findKeycloakIdByUsername(user.getUsername());
        if (StringUtils.hasText(existed)) {
            return existed;
        }
        return createUser(user, rawPassword);
    }

    public void updatePassword(String keycloakId, String newPassword, boolean temporary) {
        if (!StringUtils.hasText(keycloakId) || !StringUtils.hasText(newPassword)) {
            return;
        }
        try {
            CredentialRepresentation cred = new CredentialRepresentation();
            cred.setType(CredentialRepresentation.PASSWORD);
            cred.setTemporary(temporary);
            cred.setValue(newPassword);
            users().get(keycloakId).resetPassword(cred);
            log.info("Password updated for temporary: {}", temporary);

            // if (temporary) {
            // UserResource userResource = users().get(keycloakId);
            // UserRepresentation userRep = userResource.toRepresentation();
            // List<String> actions = userRep.getRequiredActions() != null
            // ? new java.util.ArrayList<>(userRep.getRequiredActions())
            // : new java.util.ArrayList<>();

            // if (!actions.contains("UPDATE_PASSWORD")) {
            // actions.add("UPDATE_PASSWORD");
            // userRep.setRequiredActions(actions);
            // userResource.update(userRep);
            // log.info("Added UPDATE_PASSWORD required action for user: {}", keycloakId);
            // }
            // } else {
            // UserResource userResource = users().get(keycloakId);
            // UserRepresentation userRep = userResource.toRepresentation();
            // List<String> actions = userRep.getRequiredActions();
            // if (actions != null && actions.contains("UPDATE_PASSWORD")) {
            // List<String> newActions = new java.util.ArrayList<>(actions);
            // newActions.remove("UPDATE_PASSWORD");
            // userRep.setRequiredActions(newActions);
            // userResource.update(userRep);
            // log.info("Removed UPDATE_PASSWORD required action for user: {}", keycloakId);
            // }
            // }
        } catch (WebApplicationException ex) {
            int status = ex.getResponse() != null ? ex.getResponse().getStatus() : 500;
            log.error("Keycloak update password failed: status={}, message={}", status, ex.getMessage());
            handleKeycloakError(status, ex.getMessage(), null);
        }
    }

    private void handleKeycloakError(int status, String reason, String username) {
        if (status == 409) {
            throw new DuplicateResourceException(
                    Constants.ErrorCode.USER_ALREADY_EXISTS,
                    Constants.MessageKey.USER_EXISTS,
                    Constants.Resource.USER,
                    "username",
                    username);
        } else if (status == 400) {
            throw new InvalidOperationException(
                    Constants.ErrorCode.KEYCLOAK_BAD_REQUEST,
                    Constants.MessageKey.KEYCLOAK_BAD_REQUEST,
                    reason);
        } else if (status == 401 || status == 403) {
            throw new InvalidOperationException(
                    Constants.ErrorCode.KEYCLOAK_UNAUTHORIZED,
                    Constants.MessageKey.KEYCLOAK_UNAUTHORIZED,
                    reason);
        }
        throw new BusinessException(
                Constants.ErrorCode.KEYCLOAK_ERROR,
                Constants.MessageKey.KEYCLOAK_SYSTEM,
                "Keycloak system error: " + reason);
    }
}
