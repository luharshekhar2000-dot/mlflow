from pathlib import Path

from clint.config import Config
from clint.linter import Position, Range, lint_file
from clint.rules.incorrect_type_annotation import IncorrectTypeAnnotation


def test_incorrect_type_annotation(index_path: Path) -> None:
    code = """
def bad_function_callable(param: callable) -> callable:
    ...

def bad_function_any(param: any) -> any:
    ...

def bad_function_object(param: object) -> object:
    ...

class Good:
    def __eq__(self, other: object) -> bool:
        ...

def good_function(param: Callable[[str], str]) -> Any:
    ...
"""
    config = Config(select={IncorrectTypeAnnotation.name})
    violations = lint_file(Path("test.py"), code, config, index_path)
    assert len(violations) == 6
    assert all(isinstance(v.rule, IncorrectTypeAnnotation) for v in violations)
    assert violations[0].range == Range(Position(1, 33))  # callable
    assert violations[1].range == Range(Position(1, 46))  # callable
    assert violations[2].range == Range(Position(4, 28))  # any
    assert violations[3].range == Range(Position(4, 36))  # any
    assert violations[4].range == Range(Position(7, 31))  # object
    assert violations[5].range == Range(Position(7, 42))  # object
