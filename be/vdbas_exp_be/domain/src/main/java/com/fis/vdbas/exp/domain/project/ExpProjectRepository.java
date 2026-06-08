package com.fis.vdbas.exp.domain.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpProjectRepository
        extends JpaRepository<ExpProject, String>, JpaSpecificationExecutor<ExpProject> {
}
