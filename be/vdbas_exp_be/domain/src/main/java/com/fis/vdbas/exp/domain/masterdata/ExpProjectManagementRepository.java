package com.fis.vdbas.exp.domain.masterdata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface ExpProjectManagementRepository extends JpaRepository<ExpProjectManagement, String> {}
