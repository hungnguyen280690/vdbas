package com.fis.vdbas.qtdc.domain.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, RolePermissionId> {

    List<RolePermission> findByAppCodeAndRoleCodeIn(String appCode, Collection<String> roleCodes);

    List<RolePermission> findAllByAppCodeAndRoleCode(String appCode, String roleCode);
}





