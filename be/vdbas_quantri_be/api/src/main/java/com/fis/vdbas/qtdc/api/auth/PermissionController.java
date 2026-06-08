package com.fis.vdbas.qtdc.api.auth;

import com.fis.vdbas.qtdc.application.auth.servcie.PermissionService;
import com.fis.vdbas.qtdc.application.auth.dto.PermissionDto;
import com.fis.vdbas.qtdc.application.auth.dto.PermissionSearchDto;
import com.fis.vdbas.common.dto.PageResponseDto;
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
 * Controller for managing Permissions.
 * <p>
 * Provides standard RESTful APIs to manage basic permissions (Action/Resource)
 * within the system by application code (appCode).
 * </p>
 */
@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
@Tag(name = "Permission Management", description = "APIs for managing application permissions")
public class PermissionController {

    private final PermissionService service;

    /**
     * Retrieves a list of all existing permissions (regardless of appCode).
     *
     * @return List of permission DTOs
     */
    @GetMapping
    @Operation(summary = "Get all permissions", description = "Retrieves a complete list of all permissions without pagination.")
    public List<PermissionDto> all() {
        return service.findAll();
    }

    /**
     * Searches for permissions with pagination based on a filter.
     *
     * @param body Object containing search criteria and pagination information
     * @return Result page containing the list of permissions
     */
    @PostMapping("/search")
    @Operation(summary = "Search permissions", description = "Searches for permissions with pagination and filters.")
    public PageResponseDto<PermissionDto> search(@Valid @RequestBody PermissionSearchDto body) {
        return service.search(body);
    }

    /**
     * Retrieves all permissions matching the filter criteria without pagination.
     *
     * @param body Search object
     * @return Complete list of permissions satisfying the conditions
     */
    @PostMapping("/all")
    @Operation(summary = "Get all permissions by criteria", description = "Retrieves all permissions matching the filter without pagination.")
    public List<PermissionDto> getAll(@Valid @RequestBody PermissionSearchDto body) {
        return service.getAll(body);
    }

    /**
     * Retrieves detailed information for a specific permission.
     *
     * @param appCode        Application code
     * @param permissionCode Permission code
     * @return Detailed DTO information of the permission
     */
    @GetMapping("/{appCode}/{permissionCode}")
    @Operation(summary = "Get permission by code")
    public PermissionDto get(@PathVariable String appCode, @PathVariable String permissionCode) {
        return service.get(appCode, permissionCode);
    }

    /**
     * Creates a new permission for an application.
     *
     * @param body Permission data to be created
     * @return Successfully created permission information
     */
    @PostMapping
    @Operation(summary = "Create a new permission")
    public PermissionDto create(@Valid @RequestBody PermissionDto body) {
        return service.create(body);
    }

    /**
     * Updates information for an existing permission.
     *
     * @param appCode        Application code containing the permission
     * @param permissionCode Permission code to be updated
     * @param body           Updated data
     * @return Permission after a successful update
     */
    @PutMapping("/{appCode}/{permissionCode}")
    @Operation(summary = "Update a permission")
    public PermissionDto update(@PathVariable String appCode,
            @PathVariable String permissionCode,
            @Valid @RequestBody PermissionDto body) {
        return service.update(appCode, permissionCode, body);
    }

    /**
     * Performs a soft-delete on a permission.
     *
     * @param appCode        Application code
     * @param permissionCode Permission code to be deleted
     */
    @DeleteMapping("/{appCode}/{permissionCode}")
    @Operation(summary = "Delete a permission")
    public void delete(@PathVariable String appCode, @PathVariable String permissionCode) {
        service.delete(appCode, permissionCode);
    }
}
