package com.fis.vdbas.exp.domain.lov;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ExpProjectRepository
        extends JpaRepository<ExpProject, String>, JpaSpecificationExecutor<ExpProject> {
}
