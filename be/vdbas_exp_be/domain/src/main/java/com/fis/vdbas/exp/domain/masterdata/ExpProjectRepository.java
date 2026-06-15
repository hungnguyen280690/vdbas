package com.fis.vdbas.exp.domain.masterdata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface ExpProjectRepository extends JpaRepository<ExpProject, String> {
    List<ExpProject> findByProjectCodeContainingIgnoreCaseOrProjectNameContainingIgnoreCase(String code, String name);
}
