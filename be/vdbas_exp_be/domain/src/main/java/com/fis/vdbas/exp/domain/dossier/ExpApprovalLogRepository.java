package com.fis.vdbas.exp.domain.dossier;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExpApprovalLogRepository extends JpaRepository<ExpApprovalLog, UUID> {

    List<ExpApprovalLog> findByDossierIdOrderByActionDateAsc(UUID dossierId);
}
