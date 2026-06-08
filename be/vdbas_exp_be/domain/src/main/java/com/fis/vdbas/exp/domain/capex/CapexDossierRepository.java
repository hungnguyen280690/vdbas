package com.fis.vdbas.exp.domain.capex;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CapexDossierRepository
        extends JpaRepository<CapexDossier, UUID>, JpaSpecificationExecutor<CapexDossier> {

    boolean existsByDossierCodeAndDeletedNot(@Param("dossierCode") String dossierCode,
                                             @Param("deleted") Integer deleted);

    Optional<CapexDossier> findByDossierIdAndDeleted(UUID dossierId, Integer deleted);

    @Query("SELECT MAX(e.dossierCode) FROM CapexDossier e WHERE e.dossierCode LIKE :prefix%")
    String findMaxDossierCodeByYearPrefix(@Param("prefix") String prefix);

    @Modifying
    @Query("UPDATE CapexDossier e SET e.stateCode = 'DELETED', e.deleted = 1, e.endDate = CURRENT_TIMESTAMP WHERE e.dossierId = :id")
    void softDelete(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE CapexDossier e SET e.stateCode = :stateCode WHERE e.dossierId = :id")
    void updateStateCode(@Param("id") UUID id, @Param("stateCode") String stateCode);
}
