'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import ApiKeyModal from '../components/ApiKeyModal';
// mui
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import useMediaQuery from '@mui/material/useMediaQuery';

type Message = {
  role: string;
  content: string;
};

export default function Home() {
  const [apiKey, setApiKey] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'You are a helpful assistant.' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isShowModal, setIsShowModal] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // modal
  const handleOpen = () => setIsShowModal(true);
  const handleClose = () => setIsShowModal(false);

  // format api key text
  const apiKeyFormatter = (value: string) => {
    return value.length > 10 ? `${value.slice(0, 5)}...${value.slice(-5)}` : value;
  };

  // set mui theme
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );

  const sendMessage = async (message: string) => {
    if (message.trim() === '') return

    // api key check
    const storedApiKey = localStorage.getItem('apiKey');
    if (!storedApiKey) {
      setIsShowModal(true);
      return
    }

    // set user message
    const context = [...messages, { role: 'user', content: message }]
    setMessages(context);
    
    // request
    setIsLoading(true);
    try {
      const res: any = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: context,
          stream: true
        })
      })
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      setIsLoading(false);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const decodedChunk = decoder.decode(value);
        const lines = decodedChunk.split('\n');
        
        // remove useless data
        const parsedLines = lines
          .map((line) => line.replace(/^data: /, '').trim())
          .filter((line) => (line !== '' && line !== ': OPENROUTER PROCESSING' && line !== '[DONE]'))
          .map((line) => JSON.parse(line));

        for (const line of parsedLines) {
          const content = line.choices[0].delta.content;
          if (content) {
            setMessages(previousMessages => [
              ...context,
              { role: 'assistant', content: previousMessages[previousMessages.length - 1].content + content }
            ]);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // scroll to bottom when there is new message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // check api key
  useEffect(() => {
    const storedApiKey = localStorage.getItem('apiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      setIsShowModal(true);
    }
  }, []);

  
  return (
    <ThemeProvider theme={theme}>
      <main className="min-h-screen flex justify-center">
        <div className="max-w-2xl w-full m-x-auto flex flex-col justify-between relative">

          {/* API key button and modal */}
          <div className='sticky top-2 px-2'>
            <div className='bg-white dark:bg-[#000]'>
              <Button onClick={handleOpen} variant={ apiKey ? 'outlined' : 'contained' } sx={{ width: '100%' }}>
                { apiKey ? `API Key: ${apiKeyFormatter(apiKey)}` : 'Set OpenRouter API key' }
              </Button>
            </div>
            <ApiKeyModal
              open={isShowModal}
              setOpen={setIsShowModal}
              onChange={key => setApiKey(key)}
            ></ApiKeyModal>
          </div>

          {/* message list */}
          <div className='flex-1 mt-4 mb-8'>
            {
              messages.length === 1 &&
              (
                <div className='h-full flex justify-center items-center text-center'>
                  <div>
                    <div className='text-2xl font-bold'>ChatGPT</div>
                    <div>ask me anything</div>
                  </div>
                </div>
              )
            }
            {
              messages.map((message, index) => {
                if (message.role === 'system') return
                return (
                  <div key={index} className='p-2 flex mb-2'>
                    <div className='mr-2'>
                      {message.role === 'user' && <InsertEmoticonIcon />}
                      {message.role === 'assistant' && <SmartToyIcon />}
                    </div>
                    <div>
                      <div className='font-bold'>
                        {message.role === 'user' && 'You'}
                        {message.role === 'assistant' && 'ChatGPT'}
                      </div>
                      <div>{message.content}</div>
                    </div>
                  </div>
                )
              })
            }
            {
              isLoading &&
              <div className='p-2 flex select-none'>
                <div className='mr-2'>
                  <SmartToyIcon />
                </div>
                <div>
                  <div className='font-bold'>
                    ChatGPT
                  </div>
                  <div>Typing...</div>
                </div>
              </div>
            }

            <div ref={endOfMessagesRef}></div>
          </div>

          {/* prompt input */}
          <div className='sticky bottom-2 p-4'>
            <div className='border rounded-[26px] p-1.5 px-4 transition-colors bg-[#f4f4f4] dark:bg-[#000]'>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="message ChatGPT..."
                className='w-full'
                endAdornment={
                  <ArrowCircleUpIcon
                    className='cursor-pointer'
                    onClick={() => {
                      sendMessage(inputValue);
                      setInputValue('');
                    }}
                  />
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendMessage(inputValue);
                    setInputValue('');
                  }
                }}
                disabled={isLoading}
              />
            </div>
          </div>

        </div>
      </main>
    </ThemeProvider>
  );
}
