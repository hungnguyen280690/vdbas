package com.fis.vdbas.qtdc.api.auth;

import com.fis.vdbas.qtdc.application.auth.servcie.RolePermissionService;
import com.fis.vdbas.qtdc.application.auth.dto.RolePermissionBatchDto;
import com.fis.vdbas.qtdc.application.auth.dto.RolePermissionDto;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Controller for managing Permission assignment to Roles (Role - Permission mapping).
 * <p>
 * Provides APIs to configure specific permissions for each role within an application.
 * </p>
 */
@RestController
@RequestMapping("/api/role-permissions")
@RequiredArgsConstructor
@Tag(name = "Role Permission Management", description = "APIs for assigning permissions to roles")
public class RolePermissionController {

    private final RolePermissionService service;

    /**
     * Retrieves a list of all permissions assigned to a specific role.
     *
     * @param appCode  Application code
     * @param roleCode Role code
     * @return List of DTOs containing assigned permission information
     */
    @GetMapping("/{appCode}/{roleCode}")
    @Operation(summary = "Get permissions by role", description = "Retrieves all permissions currently assigned to a specific role.")
    public List<RolePermissionDto> getAll(@PathVariable String appCode,
            @PathVariable String roleCode) {
        return service.getAll(appCode, roleCode);
    }

    /**
     * Updates the list of permissions for a role.
     * <p>
     * Performs a bulk update by removing old permissions and assigning a new set of permissions.
     * </p>
     *
     * @param body Payload containing the list of new permission codes to be assigned to the role
     */
    @PostMapping
    @Operation(summary = "Update role permissions", description = "Replaces the existing permissions of a role with a new set of permissions.")
    public void create(@Valid @RequestBody RolePermissionBatchDto body) {
        service.updateRolePermissions(body);
    }

}
