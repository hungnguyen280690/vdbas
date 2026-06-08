package com.fis.vdbas.qtdc.domain.auth;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoleRepository extends JpaRepository<Role, RoleId>, JpaSpecificationExecutor<Role> {
    @Modifying
    @Query("UPDATE Role e SET e.deleted = 1 WHERE e.appCode = :appCode AND e.roleCode = :roleCode")
    void softDelete(@Param("appCode") String appCode, @Param("roleCode") String roleCode);

    List<Role> findAllByAppCode(String appCode);

    @Query("SELECT r FROM Role r WHERE r.roleCode = :roleCode AND r.deleted = 0")
    Optional<Role> findByRoleCodeAndDeletedFalse(@Param("roleCode") String roleCode);
}
