package com.klassa.shared.logging;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class LogContextFilterTest {

    private final LogContextFilter filter = new LogContextFilter();

    @AfterEach
    void clearMdc() {
        // Belt-and-suspenders: tests run on a shared pool; even though the filter calls
        // MDC.clear() in finally, an assertion failure mid-test could trip the cleanup.
        MDC.clear();
    }

    @Test
    void inboundHeader_isPreservedAndMirroredBack() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/students");
        request.addHeader(LogContextFilter.REQUEST_ID_HEADER, "abc-123");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> seenInChain = new AtomicReference<>();

        filter.doFilter(request, response, capturingChain(seenInChain));

        assertThat(seenInChain.get()).isEqualTo("abc-123");
        assertThat(response.getHeader(LogContextFilter.REQUEST_ID_HEADER)).isEqualTo("abc-123");
        assertThat(MDC.get(LogContextFilter.MDC_REQUEST_ID)).isNull(); // cleared on exit
    }

    @Test
    void missingHeader_generatesUuid() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/students");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> seenInChain = new AtomicReference<>();

        filter.doFilter(request, response, capturingChain(seenInChain));

        assertThat(seenInChain.get()).matches("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");
        assertThat(response.getHeader(LogContextFilter.REQUEST_ID_HEADER)).isEqualTo(seenInChain.get());
    }

    @Test
    void blankHeader_generatesUuid() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/students");
        request.addHeader(LogContextFilter.REQUEST_ID_HEADER, "   ");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> seenInChain = new AtomicReference<>();

        filter.doFilter(request, response, capturingChain(seenInChain));

        assertThat(seenInChain.get()).isNotBlank().doesNotContain(" ");
    }

    @Test
    void oversizedHeader_isReplacedWithGeneratedUuid() throws Exception {
        // Defensive: an attacker can otherwise inject arbitrarily long values into every log
        // line, ballooning log storage and breaking downstream parsers.
        String huge = "a".repeat(65);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/students");
        request.addHeader(LogContextFilter.REQUEST_ID_HEADER, huge);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (req, res) -> {});

        assertThat(response.getHeader(LogContextFilter.REQUEST_ID_HEADER)).isNotEqualTo(huge);
        assertThat(response.getHeader(LogContextFilter.REQUEST_ID_HEADER).length()).isLessThanOrEqualTo(64);
    }

    @Test
    void mdcClearedAfterRequest_evenWhenChainThrows() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/students");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain throwingChain = (req, res) -> { throw new RuntimeException("boom"); };

        try {
            filter.doFilter(request, response, throwingChain);
        } catch (Exception ignored) {
            // expected: filter re-throws via OncePerRequestFilter semantics
        }

        assertThat(MDC.get(LogContextFilter.MDC_REQUEST_ID)).isNull();
    }

    @Test
    void mdcClearedAfterRequest_normalFlow() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/students");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (req, res) -> {});

        assertThat(MDC.get(LogContextFilter.MDC_REQUEST_ID)).isNull();
    }

    private FilterChain capturingChain(AtomicReference<String> sink) {
        return (req, res) -> sink.set(MDC.get(LogContextFilter.MDC_REQUEST_ID));
    }
}

