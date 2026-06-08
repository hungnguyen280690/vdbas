package com.fis.vdbas.qtdc.api.profile;

import com.fis.vdbas.qtdc.application.profile.servcie.PersonProfileService;
import com.fis.vdbas.qtdc.application.profile.dto.PersonProfileDto;
import com.fis.vdbas.qtdc.application.profile.dto.PersonProfileLoadDto;
import com.fis.vdbas.qtdc.application.profile.dto.PersonProfileSearchDto;
import com.fis.vdbas.common.dto.PageResponseDto;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Controller for managing Person Profiles.
 * <p>
 * Provides APIs for searching, loading, and performing CRUD operations on personal profile data.
 * </p>
 */
@RestController
@RequestMapping("/api/person-profiles")
@RequiredArgsConstructor
public class PersonProfileController {

    private final PersonProfileService service;

    /**
     * Searches for person profiles with pagination and filtering.
     *
     * @param body Search parameters
     * @return Paginated response of person profiles
     */
    @PostMapping("/search")
    public PageResponseDto<PersonProfileDto> search(@Valid @RequestBody PersonProfileSearchDto body) {
        return service.search(body);
    }

    /**
     * Loads a list of person profiles based on specified IDs or codes.
     *
     * @param body Load parameters
     * @return List of matching person profiles
     */
    @PostMapping("/load")
    public List<PersonProfileDto> load(@Valid @RequestBody PersonProfileLoadDto body) {
        return service.load(body);
    }

    /**
     * Retrieves details of a specific person profile.
     *
     * @param id Person UUID
     * @return Person profile details
     */
    @GetMapping("/{id}")
    public PersonProfileDto get(@PathVariable UUID id) {
        return service.get(id);
    }

    /**
     * Creates a new person profile.
     *
     * @param body Person data
     * @return The created profile
     */
    @PostMapping
    public PersonProfileDto create(@Valid @RequestBody PersonProfileDto body) {
        return service.create(body);
    }

    /**
     * Updates an existing person profile.
     *
     * @param id   Person UUID
     * @param body Updated person data
     * @return The updated profile
     */
    @PutMapping("/{id}")
    public PersonProfileDto update(@PathVariable UUID id, @Valid @RequestBody PersonProfileDto body) {
        return service.update(id, body);
    }

    /**
     * Soft-deletes a person profile.
     *
     * @param id Person UUID
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    /**
     * Toggles the active status of a person profile.
     *
     * @param id     Person UUID
     * @param active New active status
     */
    @PutMapping("/{id}/active")
    public void updateActive(@PathVariable UUID id, @RequestBody Boolean active) {
        service.updateActive(id, active);
    }
}
