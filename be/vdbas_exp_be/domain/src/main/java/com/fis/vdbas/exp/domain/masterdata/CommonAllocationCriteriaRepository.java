package com.fis.vdbas.exp.domain.masterdata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface CommonAllocationCriteriaRepository extends JpaRepository<CommonAllocationCriteria, String> {}
