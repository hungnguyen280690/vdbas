package com.fis.vdbas.qtdc.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {
    List<UserRole> findByUserIdAndAppCode(UUID userId, String appCode);

    @Query("SELECT ur FROM UserRole ur " +
            "INNER JOIN User u ON ur.userId = u.id " +
            "WHERE u.externalId = :externalId " +
            "AND ur.appCode = :appCode " +
            "AND (ur.startDate IS NULL OR ur.startDate <= CURRENT_TIMESTAMP) " +
            "AND (ur.endDate IS NULL OR ur.endDate > CURRENT_TIMESTAMP)")
    List<UserRole> findByExternalIdAndAppCode(@Param("externalId") String externalId, @Param("appCode") String appCode);
}
