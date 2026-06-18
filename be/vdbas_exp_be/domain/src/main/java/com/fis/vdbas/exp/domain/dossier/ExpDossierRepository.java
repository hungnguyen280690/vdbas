package com.fis.vdbas.exp.domain.dossier;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ExpDossierRepository
        extends JpaRepository<ExpDossier, UUID>, JpaSpecificationExecutor<ExpDossier> {

    Optional<ExpDossier> findByIdAndStatus(UUID id, Integer status);

    boolean existsByDossierCode(String dossierCode);

    /** Soft-delete: STATUS=0, F_STATUS=CANCELLED (xem service set fStatus). */
    @Modifying
    @Query("UPDATE ExpDossier d SET d.status = 0, d.fStatus = com.fis.vdbas.exp.common.enums.DossierStatus.CANCELLED "
            + "WHERE d.id = :id")
    void softDelete(@Param("id") UUID id);
}
