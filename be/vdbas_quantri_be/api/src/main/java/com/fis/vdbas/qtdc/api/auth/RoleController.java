package com.fis.vdbas.qtdc.api.auth;

import com.fis.vdbas.qtdc.application.auth.servcie.RoleService;
import com.fis.vdbas.qtdc.application.auth.dto.RoleDto;
import com.fis.vdbas.qtdc.application.auth.dto.RoleSearchDto;
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
 * Controller for managing Roles.
 * <p>
 * Allows creating, editing, deleting, and searching for application roles
 * based on the application code (appCode).
 * </p>
 */
@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Tag(name = "Role Management", description = "APIs for managing application roles")
public class RoleController {

    private final RoleService service;

    /**
     * Retrieves all roles for an application.
     *
     * @param body Search object containing {@code appCode}
     * @return A list of roles belonging to that application
     */
    @PostMapping("/all")
    @Operation(summary = "Get all roles by AppCode", description = "Retrieves all roles associated with a specific application code.")
    public List<RoleDto> getAll(@Valid @RequestBody RoleSearchDto body) {
        return service.getAll(body.getAppCode());
    }

    /**
     * Searches for roles with pagination based on a filter.
     *
     * @param body {@link RoleSearchDto} containing filter and pagination parameters
     * @return Paginated list of roles
     */
    @PostMapping("/search")
    @Operation(summary = "Search roles", description = "Searches for roles with pagination and filters.")
    public PageResponseDto<RoleDto> search(@Valid @RequestBody RoleSearchDto body) {
        return service.search(body);
    }

    /**
     * Retrieves detailed information for a role.
     *
     * @param appCode  Application code
     * @param roleCode Role code
     * @return Detailed role information
     */
    @GetMapping("/{appCode}/{roleCode}")
    @Operation(summary = "Get role by code")
    public RoleDto get(@PathVariable String appCode, @PathVariable String roleCode) {
        return service.get(appCode, roleCode);
    }

    /**
     * Creates a new role for an application.
     *
     * @param body New role data
     * @return The newly created role
     */
    @PostMapping
    @Operation(summary = "Create a new role")
    public RoleDto create(@Valid @RequestBody RoleDto body) {
        return service.create(body);
    }

    /**
     * Updates role information.
     *
     * @param appCode  Application code
     * @param roleCode Role code to be updated
     * @param body     New data
     * @return The role after the update
     */
    @PutMapping("/{appCode}/{roleCode}")
    @Operation(summary = "Update a role")
    public RoleDto update(@PathVariable String appCode,
            @PathVariable String roleCode,
            @Valid @RequestBody RoleDto body) {
        return service.update(appCode, roleCode, body);
    }

    /**
     * Performs a soft-delete on a role.
     *
     * @param appCode  Application code
     * @param roleCode Role code to be deleted
     */
    @DeleteMapping("/{appCode}/{roleCode}")
    @Operation(summary = "Delete a role")
    public void delete(@PathVariable String appCode, @PathVariable String roleCode) {
        service.delete(appCode, roleCode);
    }
}
