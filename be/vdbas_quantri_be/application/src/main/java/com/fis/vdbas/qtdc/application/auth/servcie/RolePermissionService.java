package com.fis.vdbas.qtdc.application.auth.servcie;

import com.fis.vdbas.qtdc.application.auth.dto.RolePermissionBatchDto;
import com.fis.vdbas.qtdc.application.auth.dto.RolePermissionDto;
import com.fis.vdbas.qtdc.application.auth.mapper.RolePermissionMapper;
import com.fis.vdbas.qtdc.domain.auth.RolePermission;
import com.fis.vdbas.qtdc.domain.auth.RolePermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import com.fis.vdbas.qtdc.common.CacheConstants;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for processing business logic related to Role-Permission Mapping.
 * <p>
 * Provides functionality to retrieve the current list of permissions for a role
 * and perform updates (add/remove) via a matching mechanism.
 * All changes trigger the eviction of user permission cache (CacheEvict).
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RolePermissionService {

    private final RolePermissionRepository repository;
    private final RolePermissionMapper mapper;

    /**
     * Retrieves all permissions currently assigned to a specific role.
     *
     * @param appCode  Application code
     * @param roleCode Role code
     * @return List of permission DTOs belonging to the role
     */
    public List<RolePermissionDto> getAll(String appCode, String roleCode) {
        return mapper.toDtoList(repository.findAllByAppCodeAndRoleCode(appCode, roleCode));
    }

    /**
     * Updates the list of permissions for a role (Bulk update).
     * <p>
     * Execution Logic:
     * 1. Retrieve the current list of permissions from the database.
     * 2. Identify permissions existing in the database but missing from the new list -> Delete.
     * 3. Identify permissions present in the new list but missing from the database -> Add.
     * </p>
     * This operation will automatically refresh the user permissions cache.
     *
     * @param input Payload containing application code, role code, and the new list of permission codes
     */
    @Transactional
    @CacheEvict(value = CacheConstants.USER_PERMISSIONS_CACHE, allEntries = true)
    public void updateRolePermissions(RolePermissionBatchDto input) {
        String appCode = input.getAppCode();
        String roleCode = input.getRoleCode();
        List<String> newPermissionCodes = input.getPermissionCodes() != null ? input.getPermissionCodes() : List.of();

        // 1. Get existing permissions
        List<RolePermission> existingRolePermissions = repository.findAllByAppCodeAndRoleCode(appCode, roleCode);
        Set<String> existingPermissionCodes = existingRolePermissions.stream()
                .map(RolePermission::getPermissionCode)
                .collect(Collectors.toSet());

        // 2. Identify permissions to delete (existing but not in new list)
        List<RolePermission> toDelete = existingRolePermissions.stream()
                .filter(rp -> !newPermissionCodes.contains(rp.getPermissionCode()))
                .collect(Collectors.toList());

        if (!toDelete.isEmpty()) {
            repository.deleteAllInBatch(toDelete);
        }

        // 3. Identify permissions to add (new but not in existing list)
        List<RolePermission> toAdd = newPermissionCodes.stream()
                .filter(pc -> !existingPermissionCodes.contains(pc))
                .map(pc -> {
                    RolePermission rp = new RolePermission();
                    rp.setAppCode(appCode);
                    rp.setRoleCode(roleCode);
                    rp.setPermissionCode(pc);
                    return rp;
                })
                .collect(Collectors.toList());

        if (!toAdd.isEmpty()) {
            repository.saveAll(toAdd);
        }
    }

}
