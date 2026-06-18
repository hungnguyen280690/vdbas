package com.fis.vdbas.exp.domain.lov;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpProjectSpecificRepository extends JpaRepository<ExpProjectSpecific, String> {

    List<ExpProjectSpecific> findByProjectCodeAndStatus(String projectCode, Integer status);
}
