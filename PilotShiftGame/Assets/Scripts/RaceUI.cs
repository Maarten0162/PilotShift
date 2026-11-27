using System;
using System.Collections;
using System.Threading;
using TMPro;
using UnityEngine;

public class RaceUI : MonoBehaviour
{
    [SerializeField] private TMP_Text Timer;
    [SerializeField] private TMP_Text CheckpointCounter;
    [SerializeField] private TMP_Text FinishText;
    [SerializeField] private TMP_Text Countdown;
    public TMP_Text CountdownHud => Countdown;
    [SerializeField] private GameManager gm;

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        Timer.text = "00.00";
        CheckpointCounter.text = "Checkpoint: 0 / " + gm.checkpointGenerator.CheckpointAmount;
        FinishText.enabled = false;
    }

    // Update is called once per frame
    void Update()
    {
        if(gm.CurrentState == GameManager.GameState.Active)
        {
            UpdateHUD();
        }
    }

    public IEnumerator StartCountdown()
    {
        Countdown.enabled = true;
        Debug.LogWarning("here");

        Countdown.text = "3";
        yield return new WaitForSeconds(1f);
        Countdown.text = "2";
        Debug.LogWarning("here2");

        yield return new WaitForSeconds(1f);
        Countdown.text = "1";

        yield return new WaitForSeconds(1f);
        Countdown.text = "GO!!!";
    }

    private void UpdateHUD()
    {
        Timer.text = Math.Round(Time.timeAsDouble - gm.raceStartTime, 2).ToString();
        CheckpointCounter.text = "Checkpoint: " + gm.checkpointGenerator.nextCheckpointIndex + " / " + gm.checkpointGenerator.CheckpointAmount;
    }

    public IEnumerator FinishHUDTrigger()
    {
        Countdown.enabled = false;
        CheckpointCounter.enabled = false;
        Timer.enabled = false;

        FinishText.enabled = true;
        yield return new WaitForSeconds(1f);
        FinishText.enabled = false;

    }
}
