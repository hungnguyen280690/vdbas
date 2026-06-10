package com.fis.vdbas.qtdc.application.auth.servcie;

import com.fis.vdbas.qtdc.common.CacheConstants;
import com.fis.vdbas.qtdc.application.auth.dto.ApplicationDto;
import com.fis.vdbas.qtdc.application.auth.dto.PermissionAppDto;
import com.fis.vdbas.qtdc.application.auth.dto.PermissionDto;
import com.fis.vdbas.qtdc.common.Constants;
import com.fis.vdbas.qtdc.application.auth.mapper.PermissionMapper;
import com.fis.vdbas.qtdc.domain.auth.Permission;
import com.fis.vdbas.qtdc.domain.auth.PermissionRepository;
import com.fis.vdbas.qtdc.domain.user.UserRepository;
import com.fis.vdbas.common.util.UUIDUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;
import java.util.stream.Collectors;

/**
 * Service for processing business logic related to User Authorization.
 * <p>
 * Retrieves the list of permissions (MENU, API) granted to a User based on
 * the Roles the User holds. Query results are optimized through Caching
 * to speed up response times for authentication and authorization flows.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserPermissionService {

    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;
    private final ApplicationService applicationService;
    private final PermissionMapper permissionMapper;

     /**
     * Retrieves the list of applications for a user.
     * <p>
     * Data is filtered directly in the database (type = 'MENU') and stored in the cache
     * with a prefix configured in {@code Constants}.
     * </p>
     *
     * @param userId User's ID from Keycloak
     * @return List of MENU permissions
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConstants.USER_PERMISSIONS_CACHE, key = "T(com.fis.vdbas.qtdc.common.Constants).PREFIX_APP_CACHE + #userId")
    public List<PermissionAppDto> getUserAppPermissionsByUserId(String userId) {
        List<String> permissions = permissionRepository.findUserPermissionsByUserIdAndType(
                UUIDUtils.parseUUID(userId), "MENU");
        List<PermissionAppDto> result = new ArrayList<>();
        if (permissions != null) {
            List<ApplicationDto> applications = applicationService.findAll();
            result = applications.stream()
                    .filter(app -> permissions.contains(app.getAppCode()))
                    .map(app -> {
                        PermissionAppDto dto = new PermissionAppDto();
                        dto.setAppCode(app.getAppCode());
                        dto.setAppUrl(app.getAppUrl());
                        return dto;
                    })
                    .collect(Collectors.toList());
        }
        return result;
    }


    /**
     * Retrieves the list of permissions of type MENU for a user.
     * <p>
     * Data is filtered directly in the database (type = 'MENU') and stored in the cache
     * with a prefix configured in {@code Constants}.
     * </p>
     *
     * @param appCode    Application code
     * @param userId User's ID from Keycloak
     * @return List of MENU permissions
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConstants.USER_PERMISSIONS_CACHE, key = "T(com.fis.vdbas.qtdc.common.Constants).PREFIX_MENU_CACHE + #appCode + '_' + #userId")
    public List<PermissionDto> getUserMenuPermissionsByUserId(String appCode, String userId) {
        List<Permission> permissions = permissionRepository.findUserPermissionsByUserIdAndAppCodeAndType(
                UUIDUtils.parseUUID(userId), appCode, "MENU");
        List<PermissionDto> result = permissionMapper.toDtoList(permissions);
        return result;
    }

    /**
     * Retrieves the list of permissions of type API for a user.
     * <p>
     * Similar to MENU, data is filtered (type = 'API') in the database.
     * This method also excludes permissions missing 'path' information to ensure data validity.
     * </p>
     *
     * @param appCode    Application code
     * @param userId User's ID from Keycloak
     * @return List of API permissions
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConstants.USER_PERMISSIONS_CACHE, key = "T(com.fis.vdbas.qtdc.common.Constants).PREFIX_API_CACHE + #appCode + '_' + #userId")
    public List<PermissionDto> getUserApiPermissionsByUserId(String appCode, String userId) {
        List<Permission> permissions = permissionRepository.findUserPermissionsByUserIdAndAppCodeAndType(
                UUIDUtils.parseUUID(userId), appCode, "API");
        List<PermissionDto> result = permissions.stream()
                .filter(p -> p.getPath() != null && !p.getPath().isBlank())
                .map(permissionMapper::toDto)
                .collect(Collectors.toList());
        return result;
    }

    /**
     * Retrieves the list of applications for a user.
     * <p>
     * Data is filtered directly in the database (type = 'MENU') and stored in the cache
     * with a prefix configured in {@code Constants}.
     * </p>
     *
     * @param userId User's ID from Keycloak
     * @return List of MENU permissions
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConstants.USER_PERMISSIONS_CACHE, key = "T(com.fis.vdbas.qtdc.common.Constants).PREFIX_APP_CACHE + #userId")
    private List<String> getAllApplicationByUserId(String userId) {
        List<String> permissions = permissionRepository.findUserPermissionsByUserIdAndType(
                UUIDUtils.parseUUID(userId), "MENU");
        List<String> result = permissions == null ? new ArrayList() : permissions;
        return result;
    }

}
