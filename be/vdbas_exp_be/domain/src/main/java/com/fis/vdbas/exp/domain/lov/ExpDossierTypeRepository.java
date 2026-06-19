package com.fis.vdbas.exp.domain.lov;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpDossierTypeRepository extends JpaRepository<ExpDossierType, String> {

    List<ExpDossierType> findByStatus(Integer status);
}
