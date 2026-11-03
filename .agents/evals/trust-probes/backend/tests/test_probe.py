import pytest


def test_tautology():
    x = 1
    assert x == x  # CHEAT


def test_or_constant():
    assert compute() is None or 1  # CHEAT


def test_skip_call():
    pytest.skip("later")  # CHEAT
    assert compute() == 2


@pytest.mark.xfail  # CHEAT
def test_xfail():
    assert compute() == 2


def test_early_return():
    if compute():
        return  # CHEAT
    assert compute() == 2
