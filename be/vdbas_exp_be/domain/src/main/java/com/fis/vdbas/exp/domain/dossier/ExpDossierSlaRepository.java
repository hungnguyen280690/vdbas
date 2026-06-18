package com.fis.vdbas.exp.domain.dossier;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ExpDossierSlaRepository extends JpaRepository<ExpDossierSla, UUID> {
}
