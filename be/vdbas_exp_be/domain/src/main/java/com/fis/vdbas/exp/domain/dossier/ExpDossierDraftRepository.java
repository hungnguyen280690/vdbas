package com.fis.vdbas.exp.domain.dossier;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ExpDossierDraftRepository extends JpaRepository<ExpDossierDraft, UUID> {

    Optional<ExpDossierDraft> findByDossierId(UUID dossierId);
}
