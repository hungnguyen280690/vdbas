package com.fis.vdbas.exp.domain.dossier;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpDossierAttachmentRepository extends JpaRepository<ExpDossierAttachment, UUID> {

    List<ExpDossierAttachment> findByDossierIdOrderByCreatedAtAsc(UUID dossierId);

    Optional<ExpDossierAttachment> findByIdAndDossierId(UUID id, UUID dossierId);
}
