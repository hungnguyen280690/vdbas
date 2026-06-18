package com.fis.vdbas.exp.domain.lov;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommonTreasuryRepository extends JpaRepository<CommonTreasury, String> {

    List<CommonTreasury> findByTreasuryNameContainingIgnoreCaseOrTreasuryCodeContainingIgnoreCase(
            String name, String code);
}
