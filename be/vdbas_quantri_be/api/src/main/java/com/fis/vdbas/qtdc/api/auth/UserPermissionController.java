package com.fis.vdbas.qtdc.api.auth;

import com.fis.vdbas.qtdc.application.auth.dto.ApiPermissionDto;
import com.fis.vdbas.qtdc.application.auth.dto.MenuNodeDto;
import com.fis.vdbas.qtdc.application.auth.dto.PermissionAppDto;
import com.fis.vdbas.qtdc.application.auth.dto.PermissionDto;
import com.fis.vdbas.qtdc.application.auth.servcie.UserPermissionService;
import com.fis.vdbas.common.util.TokenUtils;
import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Controller serving the currently logged-in User.
 * <p>
 * Provides APIs to retrieve dynamic Menu Trees and Endpoints (APIs)
 * that the current user is authorized to access, assisting the Frontend in
 * rendering the UI accordingly.
 * </p>
 */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@Tag(name = "My Permissions", description = "APIs for retrieving logged-in user permissions and menus")
public class UserPermissionController {

    private final UserPermissionService userPermissionService;

    private static final Logger log = LoggerFactory.getLogger(UserPermissionController.class);

    /**
     * Retrieves all apps based on the logged-in user's permissions.
     * <p>
     * Only returns permissions of type MENU. The data is structured as a Tree
     * based on the parent_code attribute for easy rendering by the Frontend.
     * </p>
     *
     * @return List of root nodes for the menu tree
     */
    @GetMapping("/apps")
    @Operation(summary = "Get my apps", description = "Retrieves the dynamic app based on the logged-in user's roles.")
    public List<PermissionAppDto> getMyApps() {
        String userId = TokenUtils.getUserId().orElse(null);
        log.info("User ID: {}", userId);
        return userPermissionService.getUserAppPermissionsByUserId(userId);
    }

    /**
     * Retrieves the menu tree based on the logged-in user's permissions.
     * <p>
     * Only returns permissions of type MENU. The data is structured as a Tree
     * based on the parent_code attribute for easy rendering by the Frontend.
     * </p>
     *
     * @return List of root nodes for the menu tree
     */
    @GetMapping("/menus")
    @Operation(summary = "Get my menus", description = "Retrieves the dynamic menu tree based on the logged-in user's roles.")
    public List<MenuNodeDto> getMyMenus(@RequestParam("appCode") String appCode) {
        String userId = TokenUtils.getUserId().orElse(null);
        List<PermissionDto> menuPermissions = userPermissionService.getUserMenuPermissionsByUserId(appCode,
                userId);
        return buildMenuTree(menuPermissions);
    }

    /**
     * Retrieves the list of all APIs the current user is authorized to execute.
     * <p>
     * The Frontend can retrieve and cache this list to show/hide buttons
     * or block page access locally before calling the Backend.
     * </p>
     *
     * @return List of API paths and methods
     */
    @GetMapping("/apis")
    @Operation(summary = "Get my API permissions", description = "Retrieves a flat list of API endpoints accessible by the user.")
    public List<ApiPermissionDto> getMyApiPermissions(@RequestParam("appCode") String appCode) {
        String userId = TokenUtils.getUserId().orElse(null);
        List<PermissionDto> permissions = userPermissionService.getUserApiPermissionsByUserId(appCode, userId);
        return permissions.stream()
                .map(p -> ApiPermissionDto.builder()
                        .code(p.getPermissionCode())
                        .name(p.getPermissionName())
                        .path(p.getPath())
                        .method(p.getMethod())
                        .build())
                .collect(Collectors.toList());
    }

    private List<MenuNodeDto> buildMenuTree(List<PermissionDto> permissions) {
        Map<String, MenuNodeDto> nodeMap = new HashMap<>();
        List<MenuNodeDto> roots = new ArrayList<>();

        // Create nodes for all permissions (MENU only as already filtered)
        for (PermissionDto p : permissions) {
            MenuNodeDto node = MenuNodeDto.builder()
                    .code(p.getPermissionCode())
                    .name(p.getPermissionName())
                    // .type(p.getType())
                    .path(p.getPath())
                    .method(p.getMethod())
                    .build();
            nodeMap.put(p.getPermissionCode(), node);
        }

        // Assemble tree based on parent_code
        for (PermissionDto p : permissions) {
            MenuNodeDto node = nodeMap.get(p.getPermissionCode());
            String parentCode = p.getParentCode();
            if (parentCode == null || parentCode.isBlank()) {
                roots.add(node);
            } else {
                MenuNodeDto parent = nodeMap.get(parentCode);
                if (parent != null) {
                    parent.getChildren().add(node);
                } else {
                    // If parent is not found (incorrect data structure), push to root to avoid
                    // losing the node
                    roots.add(node);
                }
            }
        }

        // Return the root MENU nodes for the frontend to render the tree
        return roots;
    }
}
