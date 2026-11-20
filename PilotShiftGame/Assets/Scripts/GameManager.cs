using System;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    private double raceStartTime;
    private double raceTime;

    public enum GameState
    {
        Waiting,
        Active,
        Paused,
        Finished
    }

    public GameState CurrentState {get; private set;} = GameState.Waiting;

    void Start()
    {
        Time.timeScale = 0f;

    }

    // Update is called once per frame
    void Update()
    {
        if(CurrentState == GameState.Active) raceTime = Time.timeAsDouble - raceStartTime;
    }

    private void StartRace()
    {
        CurrentState = GameState.Active;
        raceStartTime = Time.timeAsDouble;
        Time.timeScale = 1f;
    }

    private void FinishRace()
    {
        if (CurrentState == GameState.Active)
        {
            CurrentState = GameState.Finished;
            Time.timeScale = 0f;
        } else Debug.LogError("Cannot finish while no race is started");
    }
}
