package com.fis.vdbas.qtdc.application.user.servcie;

import com.fis.vdbas.qtdc.application.auth.keycloak.servcie.KeycloakUserService;
import com.fis.vdbas.qtdc.common.Constants;
import com.fis.vdbas.common.exception.AccessDeniedException;
import com.fis.vdbas.common.exception.InvalidOperationException;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.qtdc.application.user.dto.UserDto;
import com.fis.vdbas.qtdc.application.user.dto.UserResetPasswordDto;
import com.fis.vdbas.qtdc.application.user.dto.UserSearchDto;
import com.fis.vdbas.qtdc.application.user.mapper.UserMapper;
import com.fis.vdbas.qtdc.common.enums.AuthSource;
import com.fis.vdbas.qtdc.common.enums.OwnerType;
import com.fis.vdbas.common.util.TokenUtils;
import com.fis.vdbas.qtdc.domain.profile.OrganizationPerson;
import com.fis.vdbas.qtdc.domain.profile.OrganizationPersonRepository;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfile;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfileRepository;
import com.fis.vdbas.qtdc.domain.profile.PersonProfile;
import com.fis.vdbas.qtdc.domain.profile.PersonProfileRepository;
import com.fis.vdbas.qtdc.domain.user.User;
import com.fis.vdbas.qtdc.domain.user.UserRepository;
import com.fis.vdbas.qtdc.domain.user.UserRole;
import com.fis.vdbas.qtdc.domain.user.UserRoleRepository;
import com.fis.vdbas.qtdc.application.common.util.ManagementScopeHelper;

import org.springframework.beans.factory.annotation.Value;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.CriteriaBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;

/**
 * Service for managing User Accounts and Identity.
 * <p>
 * Handles user lifecycle, including creation, updates, and synchronization with Keycloak.
 * Implements fine-grained security checks based on organizational hierarchy and management scopes.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final OrganizationProfileRepository organizationRepository;
    private final OrganizationPersonRepository organizationPersonRepository;
    private final PersonProfileRepository personRepository;
    private final KeycloakUserService keycloakUserService;
    private final UserMapper mapper;
    private final ManagementScopeHelper scopeHelper;
    private final UserRoleRepository userRoleRepository;

    @Value("${app.code:QTTT}")
    private String appCode;

    @Value("${app.security.default-role:DEFAULT}")
    private String defaultRoleCode;

    private User getCurrentUser() {
        String externalId = TokenUtils.getUserId()
                .orElseThrow(() -> new RuntimeException(Constants.ErrorMessage.USER_NOT_AUTHENTICATED));
        return userRepository.findByExternalId(externalId)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.CURRENT_USER_NOT_FOUND));
    }

    /**
     * Searches for users with pagination, filtering, and security enforcement.
     *
     * @param criteria Search and pagination parameters
     * @return Paginated response of user DTOs
     */
    public PageResponseDto<UserDto> search(UserSearchDto criteria) {
        String sortBy = (criteria.getSortBy() != null && !criteria.getSortBy().isBlank())
                ? criteria.getSortBy()
                : "username";
        Direction direction = "desc".equalsIgnoreCase(criteria.getSortDirection())
                ? Direction.DESC
                : Direction.ASC;

        Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(), Sort.by(direction, sortBy));
        Page<User> page = userRepository.findAll(this.filter(criteria), pageable);

        PageResponseDto<UserDto> response = PageResponseDto.<UserDto>builder()
                .content(mapper.toDtoList(page.getContent()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
        return response;
    }

    /**
     * Retrieves a specific user profile by its ID.
     * <p>
     * Validates that the current user has permission to view the target user's details.
     * </p>
     *
     * @param id User UUID
     * @return User DTO
     */
    public UserDto get(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.USER_NOT_FOUND));
        validateUserAccess(user);
        return mapper.toDto(user);
    }

    /**
     * Retrieves the current authenticated user's profile information.
     *
     * @return User DTO of the current user
     */
    public UserDto get() {
        User currentUser = getCurrentUser();
        return mapper.toDto(currentUser);
    }

    /**
     * Creates a new user account, synchronizing it with Keycloak.
     * <p>
     * Validates management permissions, ensures profile consistency, and assigns a default role.
     * </p>
     *
     * @param newUser User data to create
     * @return The created user DTO
     */
    @Transactional
    public UserDto create(UserDto newUser) {

        // 1. Check permissions and get corresponding Organization
        OrganizationProfile targetOrg = validateManagementPermission(newUser.getOwnerType(), newUser.getOwnerId());

        User entity = mapper.toEntity(newUser);
        entity.setId(null);

        // 2. Add profile information for Keycloak (to get Email)
        if (OwnerType.ORG.equals(entity.getOwnerType())) {
            entity.setOwnerOrganization(targetOrg);
        } else if (OwnerType.PERSON.equals(entity.getOwnerType())) {
            PersonProfile person = personRepository.findById(entity.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                            Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.PERSON_NOT_FOUND));
            entity.setOwnerPerson(person);
        }

        UserDto result = saveAndSyncUser(entity, null);

        // Assign default role
        UserRole defaultRole = new UserRole();
        defaultRole.setUserId(result.getId());
        defaultRole.setAppCode(appCode);
        defaultRole.setRoleCode(defaultRoleCode);
        userRoleRepository.save(defaultRole);

        return result;
    }

    /**
     * Updates the status of a user (e.g., active, inactive, locked).
     * <p>
     * Synchronizes the status change with Keycloak.
     * </p>
     *
     * @param id     User UUID
     * @param status New status code
     */
    @Transactional
    public void updateStatus(UUID id, Integer status) {
        User user = userRepository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.USER_NOT_FOUND));
        validateManagementPermission(user.getOwnerType(), user.getOwnerId());

        userRepository.updateStatus(id, status);
        keycloakUserService.updateUser(user);
    }

    private OrganizationProfile validateManagementPermission(OwnerType ownerType, UUID ownerId) {
        User currentUser = getCurrentUser();

        // 1. System Admin has full permissions
        if (Constants.ADMIN_USERNAME.equals(currentUser.getUsername())) {
            if (OwnerType.ORG.equals(ownerType)) {
                return organizationRepository.findById(ownerId)
                        .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                                Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.ORG_NOT_FOUND));
            } else {
                UUID targetOrgId = organizationPersonRepository.findByPersonIdAndMainTrueAndActiveTrue(ownerId)
                        .map(OrganizationPerson::getOrgId)
                        .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                                Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.MAIN_ORG_NOT_FOUND));
                return organizationRepository.findById(targetOrgId)
                        .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                                Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.ORG_NOT_FOUND));
            }
        }

        // 2. Check OrgAdmin
        // if (currentUser.getIsOrgAdmin() == null || !currentUser.getIsOrgAdmin()) {
        //     throw new AccessDeniedException(Constants.ErrorCode.ACCESS_DENIED,
        //             Constants.MessageKey.ACCESS_DENIED_ADMIN_ONLY, Constants.ErrorMessage.ACCESS_DENIED_ADMIN_ONLY);
        // }

        UUID targetOrgId = null;
        if (OwnerType.ORG.equals(ownerType)) {
            targetOrgId = ownerId;
        } else if (OwnerType.PERSON.equals(ownerType)) {
            targetOrgId = organizationPersonRepository.findByPersonIdAndMainTrueAndActiveTrue(ownerId)
                    .map(OrganizationPerson::getOrgId)
                    .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                            Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.MAIN_ORG_NOT_FOUND));
        }

        OrganizationProfile targetOrg = organizationRepository.findById(targetOrgId)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.ORG_NOT_FOUND));

        // 3. Check permission based on PATH
        UUID adminOrgId = null;
        String adminOrgPath = null;
        if (OwnerType.ORG.equals(currentUser.getOwnerType())) {
            adminOrgId = currentUser.getOwnerId();
            if (currentUser.getOwnerOrganization() != null) {
                adminOrgPath = currentUser.getOwnerOrganization().getPaths();
            }
        } else if (OwnerType.PERSON.equals(currentUser.getOwnerType())) {
            OrganizationPerson mainOrg = organizationPersonRepository
                    .findByPersonIdAndMainTrueAndActiveTrue(currentUser.getOwnerId())
                    .orElse(null);
            if (mainOrg != null && mainOrg.getOrganization() != null) {
                adminOrgId = mainOrg.getOrgId();
                adminOrgPath = mainOrg.getOrganization().getPaths();
            }
        }

        String targetOrgPath = targetOrg.getPaths();

        if (targetOrgPath != null && adminOrgPath != null && targetOrgPath.startsWith(adminOrgPath)) {
            return targetOrg;
        }

        // 4. Check permission based on Scope
        if (adminOrgId != null && scopeHelper.hasManagementPermission(currentUser, targetOrg)) {
            return targetOrg;
        }

        throw new AccessDeniedException(Constants.ErrorCode.ACCESS_DENIED,
                Constants.MessageKey.ACCESS_DENIED_ORG_NO_PERMISSION,
                Constants.ErrorMessage.ACCESS_DENIED_ORG_NO_PERMISSION);
    }

    private UserDto saveAndSyncUser(User entity, String rawPassword) {
        // Create or update user on Keycloak, ensure Email is set
        String keycloakId = keycloakUserService.ensureUserExists(entity, rawPassword);
        entity.setExternalId(keycloakId);
        entity.setAuthSource(AuthSource.KEYCLOAK);

        return mapper.toDto(userRepository.save(entity));
    }

    /**
     * Updates an existing user's profile and synchronizes changes with Keycloak.
     *
     * @param id    User UUID
     * @param input Updated user data
     * @return The updated user DTO
     */
    @Transactional
    public UserDto update(UUID id, UserDto input) {

        // 1. Check permissions for new target organization (if changed)
        OrganizationProfile targetOrg = validateManagementPermission(input.getOwnerType(), input.getOwnerId());

        User existing = userRepository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.USER_NOT_FOUND));

        // 2. Check management permissions for current user (before update)
        validateManagementPermission(existing.getOwnerType(), existing.getOwnerId());

        mapper.updateEntityFromDto(input, existing);

        // 3. Add profile information for Keycloak
        if (OwnerType.ORG.equals(existing.getOwnerType())) {
            existing.setOwnerOrganization(targetOrg);
        } else if (OwnerType.PERSON.equals(existing.getOwnerType())) {
            PersonProfile person = personRepository.findById(existing.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                            Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.PERSON_NOT_FOUND));
            existing.setOwnerPerson(person);
        }

        // 4. Sync with Keycloak and Save
        keycloakUserService.updateUser(existing);
        return mapper.toDto(userRepository.save(existing));
    }

    /**
     * Resets a user's password in Keycloak.
     *
     * @param id    User UUID
     * @param input Password reset data including the new password
     */
    @Transactional
    public void resetPassword(UUID id, UserResetPasswordDto input) {
        User user = userRepository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.USER_NOT_FOUND));
        validateManagementPermission(user.getOwnerType(), user.getOwnerId());
        if (!StringUtils.hasText(user.getExternalId())) {
            throw new InvalidOperationException(Constants.ErrorCode.USER_NOT_SYNCED,
                    Constants.MessageKey.USER_NOT_SYNCED,
                    "User is not synced with Keycloak");
        }
        boolean temporary = input.getRequirePasswordChange() != null && input.getRequirePasswordChange();
        keycloakUserService.updatePassword(user.getExternalId(), input.getNewPassword(), temporary);
    }

    /**
     * Soft-deletes a user from the local system and removes them from Keycloak.
     *
     * @param id User UUID to delete
     */
    @Transactional
    public void delete(UUID id) {
        User existing = userRepository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.USER_NOT_FOUND));
        validateManagementPermission(existing.getOwnerType(), existing.getOwnerId());
        if (existing.getExternalId() != null) {
            keycloakUserService.deleteUser(existing.getExternalId());
        }
        userRepository.softDelete(id);
    }

    private Specification<User> filter(UserSearchDto criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            addBasicFilters(predicates, root, cb, criteria);
            addSecurityFilters(predicates, root, cb);

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void addBasicFilters(List<Predicate> predicates, Root<User> root, CriteriaBuilder cb,
            UserSearchDto criteria) {
        if (criteria.getUsername() != null && !criteria.getUsername().isBlank()) {
            predicates.add(
                    cb.like(cb.lower(root.get("username")), "%" + criteria.getUsername().toLowerCase() + "%"));
        }

        if (criteria.getDisplayName() != null && !criteria.getDisplayName().isBlank()) {
            predicates.add(
                    cb.like(cb.lower(root.get("displayName")),
                            "%" + criteria.getDisplayName().toLowerCase() + "%"));
        }

        if (criteria.getExternalId() != null && !criteria.getExternalId().isBlank()) {
            predicates.add(cb.equal(root.get("externalId"), criteria.getExternalId()));
        }

        if (criteria.getDeleted() != null) {
            predicates.add(cb.equal(root.get("deleted"), mapper.booleanToInteger(criteria.getDeleted())));
        } else {
            predicates.add(cb.equal(root.get("deleted"), FLAG_FALSE));
        }

        if (criteria.getStatus() != null) {
            predicates.add(cb.equal(root.get("status"), criteria.getStatus()));
        }

        if (criteria.getType() != null && !criteria.getType().isBlank()) {
            predicates.add(cb.equal(root.get("type"), criteria.getType()));
        }

        if (criteria.getOwnerType() != null && !criteria.getOwnerType().isBlank()) {
            predicates.add(cb.equal(root.get("ownerType"), criteria.getOwnerType()));
        }
    }

    private void addSecurityFilters(List<Predicate> predicates, Root<User> root, CriteriaBuilder cb) {
        User currentUser = getCurrentUser();
        if (Constants.ADMIN_USERNAME.equals(currentUser.getUsername())) {
            return;
        }

        ManagementScopeHelper.UserOrgInfo orgInfo = scopeHelper.resolveUserOrgInfo(currentUser);
        log.info("User Filter - userRealOrgId: {}, userRealOrgPath: {}", orgInfo.realOrgId(), orgInfo.realOrgPath());

        List<Predicate> securityPredicates = scopeHelper.getSecurityPredicates(orgInfo, cb,
                root.get("ownerOrganization").get("paths"), root.get("ownerId"),
                root.get("ownerOrganization").get("orgType"));

        if (!securityPredicates.isEmpty()) {
            predicates.add(cb.or(securityPredicates.toArray(new Predicate[0])));
        } else if (orgInfo.realOrgId() != null) {
            predicates.add(cb.equal(root.get("ownerId"), orgInfo.realOrgId()));
        } else {
            predicates.add(cb.equal(root.get("id"), currentUser.getId()));
        }
    }

    private void validateUserAccess(User targetUser) {
        User currentUser = getCurrentUser();
        // Superadmin bypass
        if (Constants.ADMIN_USERNAME.equals(currentUser.getUsername())) {
            return;
        }

        // If the user is themselves, allow access
        if (targetUser.getId().equals(currentUser.getId())) {
            return;
        }

        // Otherwise, must have management permission
        OrganizationProfile targetOrg = null;
        if (OwnerType.ORG.equals(targetUser.getOwnerType())) {
            targetOrg = targetUser.getOwnerOrganization();
        } else if (OwnerType.PERSON.equals(targetUser.getOwnerType())) {
            targetOrg = organizationPersonRepository
                    .findByPersonIdAndMainTrueAndActiveTrue(targetUser.getOwnerId())
                    .map(OrganizationPerson::getOrganization)
                    .orElse(null);
        }

        if (targetOrg != null) {
            if (!scopeHelper.hasManagementPermission(currentUser, targetOrg)) {
                throw new AccessDeniedException(Constants.ErrorCode.ACCESS_DENIED,
                        Constants.MessageKey.ACCESS_DENIED_USER_NO_PERMISSION,
                        Constants.ErrorMessage.ACCESS_DENIED_USER_NO_PERMISSION);
            }
        } else {
            // Fallback for users without org
            throw new AccessDeniedException(Constants.ErrorCode.ACCESS_DENIED,
                    Constants.MessageKey.ACCESS_DENIED_USER_NO_PERMISSION,
                    Constants.ErrorMessage.ACCESS_DENIED_USER_NO_PERMISSION);
        }
    }

}
