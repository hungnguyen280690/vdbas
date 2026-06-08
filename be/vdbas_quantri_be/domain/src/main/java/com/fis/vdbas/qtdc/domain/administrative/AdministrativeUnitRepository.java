package com.fis.vdbas.qtdc.domain.administrative;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface AdministrativeUnitRepository
        extends JpaRepository<AdministrativeUnit, UUID>, JpaSpecificationExecutor<AdministrativeUnit> {
    @Modifying
    @Query("UPDATE AdministrativeUnit e SET e.active = :active WHERE e.id = :id")
    void updateActive(@Param("id") UUID id, @Param("active") Integer active);

    @Modifying
    @Query("UPDATE AdministrativeUnit e SET e.deleted = 1, e.active = 0, e.endDate = CURRENT_TIMESTAMP WHERE e.id = :id")
    void softDelete(@Param("id") UUID id);
}
