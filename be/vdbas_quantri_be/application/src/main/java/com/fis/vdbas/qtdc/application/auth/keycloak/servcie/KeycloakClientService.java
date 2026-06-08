package com.fis.vdbas.qtdc.application.auth.keycloak.servcie;

import com.fis.vdbas.common.exception.BusinessException;
import com.fis.vdbas.qtdc.common.Constants;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.ClientsResource;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.ClientRepresentation;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.springframework.stereotype.Service;
import com.fis.vdbas.qtdc.application.auth.keycloak.KeycloakProperties;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakClientService {

    private final Keycloak keycloak;
    private final KeycloakProperties properties;

    private RealmResource realm() {
        return keycloak.realm(properties.getRealm());
    }

    private ClientsResource clients() {
        return realm().clients();
    }

    /**
     * Create Client on Keycloak with Service Account configuration.
     * Returns the Client Secret.
     */
    public String createClient(String clientId, String appName, String clientSecret) {

        // Check if the client already exists
        List<ClientRepresentation> existing = clients().findAll().stream()
                .filter(c -> clientId.equals(c.getClientId()))
                .toList();
        if (!existing.isEmpty()) {
            String id = existing.get(0).getId();
            log.warn("Client {} already exists in Keycloak with ID: {}. Ensuring configuration is correct.", clientId,
                    id);

            // Ensure current client has Service Account and Confidential enabled
            ClientRepresentation rep = clients().get(id).toRepresentation();
            boolean changed = false;
            if (!Boolean.TRUE.equals(rep.isServiceAccountsEnabled())) {
                rep.setServiceAccountsEnabled(true);
                changed = true;
            }
            if (Boolean.TRUE.equals(rep.isPublicClient())) {
                rep.setPublicClient(false);
                changed = true;
            }
            if (!Boolean.TRUE.equals(rep.isEnabled())) {
                rep.setEnabled(true);
                changed = true;
            }
            if (changed) {
                clients().get(id).update(rep);
                log.info("Updated existing client {} to enable service accounts and confidentiality", clientId);
            }

            return getClientSecret(id);
        }

        ClientRepresentation clientRep = new ClientRepresentation();
        clientRep.setClientId(clientId);
        clientRep.setName(appName);
        clientRep.setEnabled(true);

        // Set Confidential and Service Account
        clientRep.setPublicClient(false);
        clientRep.setServiceAccountsEnabled(true);

        // Specify authentication method as client-secret
        clientRep.setClientAuthenticatorType("client-secret");

        // Configure OIDC flows
        clientRep.setStandardFlowEnabled(false);
        clientRep.setDirectAccessGrantsEnabled(true); // Enable for flexibility, some setups need this
        clientRep.setProtocol("openid-connect");
        clientRep.setBearerOnly(false);

        if (clientSecret != null && !clientSecret.isBlank()) {
            clientRep.setSecret(clientSecret);
        }

        Response response = clients().create(clientRep);
        if (response.getStatus() >= 300) {
            log.error("Keycloak create client failed: status={}, reason={}", response.getStatus(),
                    response.getStatusInfo());
            String reason = response.getStatusInfo() != null ? response.getStatusInfo().getReasonPhrase()
                    : "Unknown error";
            response.close();
            throw new BusinessException(
                    Constants.ErrorCode.KEYCLOAK_CLIENT_ERROR,
                    Constants.MessageKey.KEYCLOAK_CLIENT_CREATE,
                    "Keycloak create client failed: " + reason);
        }

        // Get ID of newly created client from Location Header
        String location = response.getLocation().getPath();
        String keycloakClientId = location.substring(location.lastIndexOf('/') + 1);
        response.close();

        log.info("Client {} created successfully with Keycloak Internal ID: {}", clientId, keycloakClientId);

        return getClientSecret(keycloakClientId);
    }

    public String getClientSecret(String keycloakClientId) {
        try {
            CredentialRepresentation cred = clients().get(keycloakClientId).getSecret();
            String secret = cred != null ? cred.getValue() : null;
            if (secret == null) {
                log.warn("Client Secret is NULL for Keycloak Internal ID: {}", keycloakClientId);
            } else {
                log.info("Successfully retrieved secret for Keycloak Internal ID: {}. Secret starts with: {}***",
                        keycloakClientId, secret.substring(0, Math.min(secret.length(), 4)));
            }
            return secret;
        } catch (Exception e) {
            log.error("Failed to get client secret for client id: {}", keycloakClientId, e);
            return null;
        }
    }

    public void updateClient(String clientId, String appName, String clientSecret) {
        List<ClientRepresentation> list = clients().findAll().stream()
                .filter(c -> clientId.equals(c.getClientId()))
                .toList();
        if (list.isEmpty()) {
            log.warn("Client {} not found in Keycloak for update", clientId);
            return;
        }
        String id = list.get(0).getId();
        ClientRepresentation rep = clients().get(id).toRepresentation();
        rep.setName(appName);
        rep.setSecret(clientSecret);
        clients().get(id).update(rep);
        log.info("Successfully synced updated client for client {} to Keycloak", clientId);
    }

    public void updateClientStatus(String clientId, boolean active) {
        List<ClientRepresentation> list = clients().findAll().stream()
                .filter(c -> clientId.equals(c.getClientId()))
                .toList();
        if (list.isEmpty()) {
            log.warn("Client {} not found in Keycloak for secret update", clientId);
            return;
        }
        String id = list.get(0).getId();
        ClientRepresentation rep = clients().get(id).toRepresentation();
        rep.setEnabled(active);
        clients().get(id).update(rep);
        log.info("Successfully synced updated clientStatus for client {} to Keycloak", clientId);
    }
}
