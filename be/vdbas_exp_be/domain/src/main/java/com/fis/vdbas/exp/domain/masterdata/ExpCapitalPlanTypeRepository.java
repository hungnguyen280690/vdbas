package com.fis.vdbas.exp.domain.masterdata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface ExpCapitalPlanTypeRepository extends JpaRepository<ExpCapitalPlanType, String> {
    List<ExpCapitalPlanType> findByStatus(Integer status);
}
