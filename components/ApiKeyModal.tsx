import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Input from '@mui/material/Input';
import Link from '@mui/material/Link';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  borderRadius: '26px',
  boxShadow: 24,
  p: 4,
  textAlign: 'center'
};

interface ApiKeyModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onChange: (apiKey: string) => void;
}

export default function BasicModal({
  open,
  setOpen,
  onChange
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // set default API key
  useEffect(() => {
    const storedApiKey = localStorage.getItem('apiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  // save API key to localstorage
  const saveApiKey = () => {
    localStorage.setItem('apiKey', apiKey);
    onChange(apiKey);
    handleClose();
  };

  return (
    <div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="w-[300px] xs:w-[500px]">
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Please enter your OpenRouter API key
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2, mb: 2 }}>
            or create a new key at <Link href="https://openrouter.ai/keys" target="_blank">openrouter.ai</Link>
          </Typography>
          <div className='sticky bottom-5 bg-white border rounded-[26px] p-1.5 px-4 transition-colors bg-[#f4f4f4] dark:bg-[#000] mb-4'>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API Key"
              sx={{ width: '100%' }}
            />
            </div>
          <Button variant="contained" onClick={saveApiKey}>Save key</Button>
        </Box>
      </Modal>
    </div>
  );
}
