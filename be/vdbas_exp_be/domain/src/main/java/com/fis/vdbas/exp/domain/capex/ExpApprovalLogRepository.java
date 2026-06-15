package com.fis.vdbas.exp.domain.capex;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExpApprovalLogRepository extends JpaRepository<ExpApprovalLog, UUID> {
    List<ExpApprovalLog> findByDossierIdOrderByCreatedDateDesc(UUID dossierId);
}
