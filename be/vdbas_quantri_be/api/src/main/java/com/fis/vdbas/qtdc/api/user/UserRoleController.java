package com.fis.vdbas.qtdc.api.user;

import com.fis.vdbas.qtdc.application.user.servcie.UserRoleService;
import com.fis.vdbas.qtdc.application.user.dto.UserRoleBatchDto;
import com.fis.vdbas.qtdc.application.user.dto.UserRoleDto;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Controller for managing User-Role assignments.
 * <p>
 * Handles the mapping between users and their roles within specific applications.
 * </p>
 */
@RestController
@RequestMapping("/api/user-roles")
@RequiredArgsConstructor
public class UserRoleController {

    private final UserRoleService service;

    /**
     * Retrieves all roles assigned to a user for a specific application.
     *
     * @param userId  User UUID
     * @param appCode Application code
     * @return List of user-role assignment DTOs
     */
    @GetMapping("/{userId}/{appCode}")
    public List<UserRoleDto> get(@PathVariable UUID userId,
            @PathVariable String appCode) {
        return service.getAll(appCode, userId);
    }

    /**
     * Updates roles for a user in a batch operation (add/remove roles).
     *
     * @param body Batch update data containing user, application, and role codes
     */
    @PostMapping
    public void create(@Valid @RequestBody UserRoleBatchDto body) {
        service.updateUserRoles(body);
    }
}
