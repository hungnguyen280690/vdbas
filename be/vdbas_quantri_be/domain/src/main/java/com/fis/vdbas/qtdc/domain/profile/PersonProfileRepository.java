package com.fis.vdbas.qtdc.domain.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface PersonProfileRepository
        extends JpaRepository<PersonProfile, UUID>, JpaSpecificationExecutor<PersonProfile> {
    @Modifying
    @Query("UPDATE PersonProfile e SET e.deleted = 1, e.active = 0 WHERE e.id = :id")
    void softDelete(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE PersonProfile e SET e.active = :active WHERE e.id = :id")
    void updateActive(@Param("id") UUID id, @Param("active") Integer active);
}
