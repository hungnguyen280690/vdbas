package com.fis.vdbas.qtdc.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    @Modifying
    @Query("UPDATE User e SET e.deleted = 1, e.status = 0 WHERE e.id = :id")
    void softDelete(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE User e SET e.status = :status WHERE e.id = :id")
    void updateStatus(@Param("id") UUID id, @Param("status") Integer status);

    Optional<User> findByExternalId(String externalId);

    Optional<User> findByUsername(String username);
}
