package com.fis.vdbas.exp.domain.lov;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommonOrganizationRepository extends JpaRepository<CommonOrganization, String> {

    List<CommonOrganization> findByStatusAndOrganizationNameContainingIgnoreCaseOrStatusAndOrganizationCodeContainingIgnoreCase(
            Integer status1, String name, Integer status2, String code);
}
