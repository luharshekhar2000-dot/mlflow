"""Tests for BaseJudgeAdapter template method and telemetry injection.

Uses a minimal FakeAdapter stub so these tests are adapter-agnostic —
they verify the base class behavior without coupling to any specific
adapter implementation.
"""

from unittest import mock

import pytest

from mlflow.entities.assessment import Feedback
from mlflow.entities.assessment_source import AssessmentSource, AssessmentSourceType
from mlflow.exceptions import MlflowException
from mlflow.genai.judges.adapters.base_adapter import (
    AdapterInvocationInput,
    AdapterInvocationOutput,
    BaseJudgeAdapter,
    DatabricksTelemetryRecorder,
    JudgeTelemetryRecorder,
)


class FakeAdapter(BaseJudgeAdapter):
    """Minimal adapter stub for testing the base class template method."""

    def __init__(self, result=None, error=None, **kwargs):
        super().__init__(**kwargs)
        self._result = result
        self._error = error

    @classmethod
    def is_applicable(cls, model_uri, prompt):
        return True

    def _invoke(self, input_params):
        if self._error:
            raise self._error
        return self._result


def _make_input(model_uri="openai:/gpt-4"):
    return AdapterInvocationInput(
        model_uri=model_uri,
        prompt="test prompt",
        assessment_name="test_metric",
    )


def _make_output(value="yes", request_id=None, prompt_tokens=None, completion_tokens=None):
    return AdapterInvocationOutput(
        feedback=Feedback(
            name="test_metric",
            value=value,
            rationale="Good",
            source=AssessmentSource(
                source_type=AssessmentSourceType.LLM_JUDGE,
                source_id="openai:/gpt-4",
            ),
        ),
        request_id=request_id,
        num_prompt_tokens=prompt_tokens,
        num_completion_tokens=completion_tokens,
    )


# --- Protocol conformance ---


def test_databricks_telemetry_recorder_satisfies_protocol():
    assert isinstance(DatabricksTelemetryRecorder(), JudgeTelemetryRecorder)


# --- Template method: success path ---


def test_invoke_calls_invoke_and_returns_output():
    output = _make_output()
    adapter = FakeAdapter(result=output)
    result = adapter.invoke(_make_input())
    assert result is output
    assert result.feedback.value == "yes"


def test_telemetry_recorder_called_on_success():
    recorder = mock.Mock()
    output = _make_output(request_id="req-1", prompt_tokens=10, completion_tokens=5)
    adapter = FakeAdapter(result=output, telemetry=recorder)
    input_params = _make_input()

    result = adapter.invoke(input_params)

    recorder.record_success.assert_called_once_with(input_params, result)
    recorder.record_failure.assert_not_called()


def test_no_telemetry_when_recorder_is_none():
    output = _make_output()
    adapter = FakeAdapter(result=output)  # no telemetry
    result = adapter.invoke(_make_input())
    assert result.feedback.value == "yes"


def test_telemetry_success_error_does_not_break_invoke():
    recorder = mock.Mock()
    recorder.record_success.side_effect = Exception("Telemetry failed")
    output = _make_output()
    adapter = FakeAdapter(result=output, telemetry=recorder)

    result = adapter.invoke(_make_input())

    assert result.feedback.value == "yes"
    recorder.record_success.assert_called_once()


# --- Template method: failure path ---


def test_telemetry_recorder_called_on_failure():
    recorder = mock.Mock()
    error = MlflowException("Model error", error_code="INTERNAL_ERROR")
    adapter = FakeAdapter(error=error, telemetry=recorder)
    input_params = _make_input()

    with pytest.raises(MlflowException, match="Model error"):
        adapter.invoke(input_params)

    recorder.record_failure.assert_called_once_with(input_params, error)
    recorder.record_success.assert_not_called()


def test_no_failure_telemetry_when_recorder_is_none():
    error = MlflowException("Model error")
    adapter = FakeAdapter(error=error)  # no telemetry

    with pytest.raises(MlflowException, match="Model error"):
        adapter.invoke(_make_input())


def test_telemetry_failure_error_does_not_suppress_exception():
    recorder = mock.Mock()
    recorder.record_failure.side_effect = Exception("Telemetry failed")
    adapter = FakeAdapter(
        error=MlflowException("Model error"),
        telemetry=recorder,
    )

    with pytest.raises(MlflowException, match="Model error"):
        adapter.invoke(_make_input())

    recorder.record_failure.assert_called_once()


def test_non_mlflow_exception_skips_failure_telemetry():
    recorder = mock.Mock()
    adapter = FakeAdapter(error=KeyError("result"), telemetry=recorder)

    with pytest.raises(KeyError, match="result"):
        adapter.invoke(_make_input())

    recorder.record_failure.assert_not_called()
    recorder.record_success.assert_not_called()


# --- DatabricksTelemetryRecorder ---


def test_databricks_recorder_success_calls_telemetry_util():
    recorder = DatabricksTelemetryRecorder()
    input_params = _make_input("databricks:/test-model")
    output = _make_output(request_id="req-1", prompt_tokens=10, completion_tokens=5)

    with mock.patch(
        "mlflow.genai.judges.adapters.base_adapter._record_judge_model_usage_success_databricks_telemetry"
    ) as mock_telemetry:
        recorder.record_success(input_params, output)

    mock_telemetry.assert_called_once_with(
        request_id="req-1",
        model_provider="databricks",
        endpoint_name="test-model",
        num_prompt_tokens=10,
        num_completion_tokens=5,
    )


def test_databricks_recorder_failure_calls_telemetry_util():
    recorder = DatabricksTelemetryRecorder()
    from mlflow.protos.databricks_pb2 import BAD_REQUEST

    input_params = _make_input("endpoints:/my-endpoint")
    error = MlflowException("Bad request", error_code=BAD_REQUEST)

    with mock.patch(
        "mlflow.genai.judges.adapters.base_adapter._record_judge_model_usage_failure_databricks_telemetry"
    ) as mock_telemetry:
        recorder.record_failure(input_params, error)

    mock_telemetry.assert_called_once_with(
        model_provider="endpoints",
        endpoint_name="my-endpoint",
        error_code="BAD_REQUEST",
        error_message=str(error),
    )
