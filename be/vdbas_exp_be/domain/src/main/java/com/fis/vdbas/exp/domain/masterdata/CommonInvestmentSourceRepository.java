package com.fis.vdbas.exp.domain.masterdata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface CommonInvestmentSourceRepository extends JpaRepository<CommonInvestmentSource, CommonInvestmentSourceId> {
    List<CommonInvestmentSource> findBySegmentCode(String segmentCode);
}
