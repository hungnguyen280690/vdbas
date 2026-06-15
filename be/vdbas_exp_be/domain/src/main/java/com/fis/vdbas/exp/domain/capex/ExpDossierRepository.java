package com.fis.vdbas.exp.domain.capex;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ExpDossierRepository extends JpaRepository<ExpDossier, UUID>, JpaSpecificationExecutor<ExpDossier> {

    boolean existsByDossierCode(String dossierCode);
}
