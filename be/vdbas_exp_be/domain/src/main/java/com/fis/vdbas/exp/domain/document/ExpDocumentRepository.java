package com.fis.vdbas.exp.domain.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExpDocumentRepository extends JpaRepository<ExpDocument, UUID> {

    List<ExpDocument> findByDossierId(UUID dossierId);

    @Query("SELECT d.dossierId, COUNT(d) FROM ExpDocument d WHERE d.dossierId IN :dossierIds GROUP BY d.dossierId")
    List<Object[]> countByDossierIdIn(@Param("dossierIds") List<UUID> dossierIds);
}
