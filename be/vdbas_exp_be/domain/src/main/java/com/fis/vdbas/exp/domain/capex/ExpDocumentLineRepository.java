package com.fis.vdbas.exp.domain.capex;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExpDocumentLineRepository extends JpaRepository<ExpDocumentLine, UUID> {
    List<ExpDocumentLine> findByDocumentId(UUID documentId);

    @Query("SELECT COALESCE(SUM(l.paymentRequestAmountVnd), 0) FROM ExpDocumentLine l " +
           "WHERE l.documentId IN (SELECT d.documentId FROM ExpDocument d WHERE d.dossierId = :dossierId)")
    BigDecimal sumPaymentRequestAmountVndByDossierId(UUID dossierId);
}
