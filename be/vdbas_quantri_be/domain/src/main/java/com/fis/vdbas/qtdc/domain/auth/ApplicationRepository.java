package com.fis.vdbas.qtdc.domain.auth;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ApplicationRepository
        extends JpaRepository<Application, UUID>, JpaSpecificationExecutor<Application> {

    @Override
    @EntityGraph(attributePaths = { "organization" })
    Page<Application> findAll(Specification<Application> spec, Pageable pageable);

    @Query("SELECT a FROM Application a WHERE a.active = 1 AND a.deleted = 0")
    java.util.List<Application> findByActiveTrueAndDeletedFalse();

    @Modifying
    @Query("UPDATE Application e SET e.active = :active WHERE e.id = :id")
    void updateActive(@Param("id") UUID id, @Param("active") Integer active);

    @Modifying
    @Query("UPDATE Application e SET e.deleted = 1, e.active = 0 WHERE e.id = :id")
    void softDelete(@Param("id") UUID id);
}
