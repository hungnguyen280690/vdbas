package com.fis.vdbas.exp.domain.masterdata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface ExpPaymentTypeRepository extends JpaRepository<ExpPaymentType, String> {
    List<ExpPaymentType> findByStatus(Integer status);
}
