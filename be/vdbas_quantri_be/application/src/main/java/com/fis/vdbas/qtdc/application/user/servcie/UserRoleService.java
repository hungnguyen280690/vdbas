package com.fis.vdbas.qtdc.application.user.servcie;

import com.fis.vdbas.qtdc.application.user.dto.UserRoleBatchDto;
import com.fis.vdbas.qtdc.application.user.dto.UserRoleDto;
import com.fis.vdbas.qtdc.application.user.mapper.UserRoleMapper;
import com.fis.vdbas.qtdc.domain.user.UserRole;
import com.fis.vdbas.qtdc.domain.user.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.fis.vdbas.qtdc.common.CacheConstants;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.transaction.annotation.Transactional;
import com.fis.vdbas.qtdc.common.Constants;
import com.fis.vdbas.common.util.TokenUtils;
import com.fis.vdbas.qtdc.domain.profile.OrganizationPerson;
import com.fis.vdbas.qtdc.domain.profile.OrganizationPersonRepository;
import com.fis.vdbas.qtdc.application.common.util.ManagementScopeHelper;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfile;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfileRepository;
import com.fis.vdbas.qtdc.domain.user.User;
import com.fis.vdbas.qtdc.domain.user.UserRepository;
import com.fis.vdbas.common.exception.AccessDeniedException;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import com.fis.vdbas.qtdc.common.enums.OwnerType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;
import java.util.stream.Collectors;

/**
 * Service for managing User-Role assignments.
 * <p>
 * Handles business logic for assigning and synchronizing roles for users
 * across different applications. Includes hierarchical security checks to
 * ensure administrators can only manage roles for users within their authority.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserRoleService {

    private final UserRoleRepository repository;
    private final UserRoleMapper mapper;
    private final OrganizationProfileRepository organizationRepository;
    private final OrganizationPersonRepository organizationPersonRepository;
    private final UserRepository userRepository;
    private final ManagementScopeHelper scopeHelper;

    private User getCurrentUser() {
        String externalId = TokenUtils.getUserId()
                .orElseThrow(() -> new RuntimeException(Constants.ErrorMessage.USER_NOT_AUTHENTICATED));
        return userRepository.findByExternalId(externalId)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.CURRENT_USER_NOT_FOUND));
    }

    /**
     * Retrieves all roles assigned to a specific user for a given application.
     * <p>
     * Validates management permissions for the target user before retrieval.
     * </p>
     *
     * @param appCode Application code
     * @param userId  User UUID
     * @return List of user-role assignment DTOs
     */
    public List<UserRoleDto> getAll(String appCode, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.USER_NOT_FOUND));
        validateManagementPermission(user.getOwnerType(), user.getOwnerId());
        return mapper.toDtoList(repository.findByUserIdAndAppCode(userId, appCode));
    }

    /**
     * Updates the set of roles assigned to a user for an application in a batch operation.
     * <p>
     * Synchronizes the database state with the provided role list by adding new roles,
     * updating existing ones, and removing roles no longer present in the input.
     * Evicts permission caches to ensure security changes take immediate effect.
     * </p>
     *
     * @param input Batch update data including user ID, application code, and role list
     */
    @Transactional
    @CacheEvict(value = CacheConstants.USER_PERMISSIONS_CACHE, allEntries = true)
    public void updateUserRoles(UserRoleBatchDto input) {
        String appCode = input.getAppCode();
        UUID userId = input.getUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.ErrorCode.NOT_FOUND,
                        Constants.MessageKey.ENTITY_NOT_FOUND, Constants.ErrorMessage.USER_NOT_FOUND));
        validateManagementPermission(user.getOwnerType(), user.getOwnerId());

        List<UserRoleDto> newRoles = input.getRoles() != null ? input.getRoles() : List.of();

        // 1. Get existing roles and map them by roleCode for lookup
        List<UserRole> existingUserRoles = repository.findByUserIdAndAppCode(userId, appCode);
        Map<String, UserRole> existingRoleMap = existingUserRoles.stream()
                .collect(Collectors.toMap(UserRole::getRoleCode, rp -> rp));

        List<UserRole> toSave = new ArrayList<>();

        // 2. Process input roles (Update or Add)
        for (UserRoleDto roleDto : newRoles) {
            String roleCode = roleDto.getRoleCode();
            UserRole entity = existingRoleMap.get(roleCode);
            if (entity != null) {
                // Update existing
                if (roleDto.getStartDate() != null) {
                    entity.setStartDate(roleDto.getStartDate());
                } else {
                    entity.setStartDate(LocalDateTime.now());
                }
                if (roleDto.getEndDate() != null) {
                    entity.setEndDate(roleDto.getEndDate());
                }
                toSave.add(entity);
                existingRoleMap.remove(roleCode); // Remove so remaining in map are to be deleted
            } else {
                // Add new
                UserRole newRole = new UserRole();
                newRole.setUserId(userId);
                newRole.setAppCode(appCode);
                newRole.setRoleCode(roleCode);
                if (roleDto.getStartDate() != null) {
                    newRole.setStartDate(roleDto.getStartDate());
                } else {
                    newRole.setStartDate(LocalDateTime.now());
                }
                newRole.setEndDate(roleDto.getEndDate());
                toSave.add(newRole);
            }
        }

        // 3. Identify roles to delete (those left in the map)
        if (!existingRoleMap.isEmpty()) {
            Collection<UserRole> toDelete = existingRoleMap.values();
            repository.deleteAllInBatch(toDelete);
        }

        // 4. Save updates and additions
        if (!toSave.isEmpty()) {
            repository.saveAll(toSave);
        }
    }

    private void validateManagementPermission(OwnerType ownerType, UUID ownerId) {
        User currentUser = getCurrentUser();

        // 1. System Admin has full permissions
        if (Constants.ADMIN_USERNAME.equals(currentUser.getUsername())) {
            return;
        }

        // 2. Check OrgAdmin
        if (currentUser.getIsOrgAdmin() == null || FLAG_FALSE.equals(currentUser.getIsOrgAdmin())) {
            throw new AccessDeniedException(Constants.ErrorCode.ACCESS_DENIED,
                    Constants.MessageKey.ACCESS_DENIED_ADMIN_ONLY, Constants.ErrorMessage.ACCESS_DENIED_ADMIN_ONLY);
        }

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
        String adminOrgPath = null;
        if (OwnerType.ORG.equals(currentUser.getOwnerType())) {
            if (currentUser.getOwnerOrganization() != null) {
                adminOrgPath = currentUser.getOwnerOrganization().getPaths();
            }
        } else if (OwnerType.PERSON.equals(currentUser.getOwnerType())) {
            OrganizationPerson mainOrg = organizationPersonRepository
                    .findByPersonIdAndMainTrueAndActiveTrue(currentUser.getOwnerId())
                    .orElse(null);
            if (mainOrg != null && mainOrg.getOrganization() != null) {
                adminOrgPath = mainOrg.getOrganization().getPaths();
            }
        }

        String targetOrgPath = targetOrg.getPaths();

        if (targetOrgPath != null && adminOrgPath != null && targetOrgPath.startsWith(adminOrgPath)) {
            return;
        }

        // 4. Check permission based on Scope
        if (scopeHelper.hasManagementPermission(currentUser, targetOrg)) {
            return;
        }

        throw new AccessDeniedException(Constants.ErrorCode.ACCESS_DENIED,
                Constants.MessageKey.ACCESS_DENIED_ORG_NO_PERMISSION,
                Constants.ErrorMessage.ACCESS_DENIED_ORG_NO_PERMISSION);
    }

}
