package com.fis.vdbas.exp.domain.dossier;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpDocumentRepository
        extends JpaRepository<ExpDocument, UUID>, JpaSpecificationExecutor<ExpDocument> {

    /** Danh sách chứng từ hiệu lực của hồ sơ, sắp theo ngày tạo (cho seqNo NOTE-01). */
    List<ExpDocument> findByDossierIdAndStatusOrderByCreatedAtAsc(UUID dossierId, Integer status);

    Optional<ExpDocument> findByIdAndDossierId(UUID id, UUID dossierId);

    long countByDossierIdAndStatus(UUID dossierId, Integer status);

    @Query("SELECT COALESCE(SUM(d.baseAmount), 0) FROM ExpDocument d "
            + "WHERE d.dossierId = :dossierId AND d.status = 1")
    long sumBaseAmountByDossierId(@Param("dossierId") UUID dossierId);

    @Modifying
    @Query("UPDATE ExpDocument d SET d.status = 0 WHERE d.id = :id")
    void softDelete(@Param("id") UUID id);
}
