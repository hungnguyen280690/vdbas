package com.fis.vdbas.exp.domain.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExpDocumentLineRepository extends JpaRepository<ExpDocumentLine, UUID> {

    List<ExpDocumentLine> findByDocumentIdIn(List<UUID> documentIds);

    @Query("""
            SELECT d.dossierId, COALESCE(SUM(dl.paymentRequestAmountVnd), 0)
            FROM ExpDocumentLine dl, ExpDocument d
            WHERE dl.documentId = d.documentId AND d.dossierId IN :dossierIds
            GROUP BY d.dossierId
            """)
    List<Object[]> sumAmountVndByDossierIdIn(@Param("dossierIds") List<UUID> dossierIds);
}
