using System;
using System.Collections;
using UnityEngine;
using UnityEngine.InputSystem;

public class GameManager : MonoBehaviour
{
    public enum GameState
    {
        Waiting,
        Active,
        Paused,
        Finished
    }
    private double raceStartTime;
    private double raceTime;
    public CheckpointGenerator checkpointGenerator;
    public GameState CurrentState {get; private set;} = GameState.Waiting;


    void Start()
    {
        Time.timeScale = 0f;

    }

    void Update()
    {
        if(Keyboard.current.spaceKey.wasPressedThisFrame)
        {
            switch (CurrentState)
            {
                case GameState.Active:
                    PauseRace();
                    break;
                
                case GameState.Paused:
                    ResumeRace();
                    break;
                
                case GameState.Waiting:
                    StartRace();
                    break;
            }
        }

        if(CurrentState == GameState.Active) raceTime = Time.timeAsDouble - raceStartTime;
    }
    
    private void StartRace()
    {
        CurrentState = GameState.Active;
        raceStartTime = Time.timeAsDouble;
        Time.timeScale = 1f;
    }

    private void ResumeRace()
    {
        if (CurrentState == GameState.Paused)
        {
            CurrentState = GameState.Active;
            Time.timeScale = 1f;
        }
    }

    private void PauseRace()
    {
        if (CurrentState == GameState.Active)
        { 
            CurrentState = GameState.Paused;
            Time.timeScale = 0f;
        }
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
