package com.fis.vdbas.qtdc.domain.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PermissionRepository
                extends JpaRepository<Permission, PermissionId>, JpaSpecificationExecutor<Permission> {

        List<Permission> findByAppCodeAndPermissionCodeIn(String appCode, Collection<String> permissionCodes);

        List<Permission> findAllByAppCodeOrderByPermissionCodeAsc(String appCode);

        /**
         * Get all user applications by externalId filtered by type.
         * Check the validity of user_role (start_date and end_date).
         */
        @Query("SELECT DISTINCT p.appCode FROM Permission p " +
                        "INNER JOIN RolePermission rp ON p.appCode = rp.appCode AND p.permissionCode = rp.permissionCode "
                        +
                        "INNER JOIN UserRole ur ON rp.appCode = ur.appCode AND rp.roleCode = ur.roleCode " +
                        "WHERE ur.userId = :userId " +
                        "AND p.type = :type " +
                        "AND (ur.startDate IS NULL OR ur.startDate <= CURRENT_TIMESTAMP) " +
                        "AND (ur.endDate IS NULL OR ur.endDate > CURRENT_TIMESTAMP)")
        List<String> findUserPermissionsByUserIdAndType(
                        @Param("userId") UUID userId,
                        @Param("type") String type);

        /**
         * Get all user permissions by externalId and appCode, filtered by type.
         * Check the validity of user_role (start_date and end_date).
         */
        @Query("SELECT DISTINCT p FROM Permission p " +
                        "INNER JOIN RolePermission rp ON p.appCode = rp.appCode AND p.permissionCode = rp.permissionCode "
                        +
                        "INNER JOIN UserRole ur ON rp.appCode = ur.appCode AND rp.roleCode = ur.roleCode " +
                        "WHERE ur.userId = :userId " +
                        "AND p.appCode = :appCode " +
                        "AND p.type = :type " +
                        "AND (ur.startDate IS NULL OR ur.startDate <= CURRENT_TIMESTAMP) " +
                        "AND (ur.endDate IS NULL OR ur.endDate > CURRENT_TIMESTAMP)")
        List<Permission> findUserPermissionsByUserIdAndAppCodeAndType(
                        @Param("userId") UUID userId,
                        @Param("appCode") String appCode,
                        @Param("type") String type);

        /**
         * Get all user permissions by externalId and appCode (without filtering by type).
         * Check the validity of user_role (start_date and end_date).
         */
        @Query("SELECT DISTINCT p FROM Permission p " +
                        "INNER JOIN RolePermission rp ON p.appCode = rp.appCode AND p.permissionCode = rp.permissionCode "
                        +
                        "INNER JOIN UserRole ur ON rp.appCode = ur.appCode AND rp.roleCode = ur.roleCode " +
                        "WHERE ur.userId = :userId " +
                        "AND p.appCode = :appCode " +
                        "AND (ur.startDate IS NULL OR ur.startDate <= CURRENT_TIMESTAMP) " +
                        "AND (ur.endDate IS NULL OR ur.endDate > CURRENT_TIMESTAMP)")
        List<Permission> findUserPermissionsByUserIdAndAppCode(
                        @Param("userId") UUID userId,
                        @Param("appCode") String appCode);
}
