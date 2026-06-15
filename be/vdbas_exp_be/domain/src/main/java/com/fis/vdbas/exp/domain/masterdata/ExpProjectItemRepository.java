package com.fis.vdbas.exp.domain.masterdata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface ExpProjectItemRepository extends JpaRepository<ExpProjectItem, String> {
    List<ExpProjectItem> findByProjectCodeAndStatus(String projectCode, Integer status);
    List<ExpProjectItem> findByStatus(Integer status);
}
